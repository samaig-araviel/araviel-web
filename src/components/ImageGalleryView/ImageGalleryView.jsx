import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { setInputValue, createNewChat, setPendingAutoSubmit } from '../../store/slices/chatSlice';
import {
  getGeneratedImages,
  deleteGeneratedImage,
  getLimitInfo,
} from '../../services/imageGeneration';
import { getUserTier, PROVIDERS } from '../../data/models';
import {
  CloseIcon,
  FileDownIcon,
  FilterIcon,
  SparkleIcon,
  SendIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MaximizeIcon,
  UserIcon,
  CameraIcon,
  PenIcon,
  StarIcon,
  LayersIcon,
  EyeIcon,
  PlusIcon,
  PhotoIcon,
} from '../Icons';
import styles from './ImageGalleryView.module.css';

const QUICK_PROMPTS = [
  {
    label: 'Cinematic portrait',
    prompt:
      'Generate a hyper-realistic cinematic portrait with dramatic rim lighting, shallow depth of field, and a moody dark background',
    icon: UserIcon,
  },
  {
    label: 'Product photography',
    prompt:
      'Generate a premium product photography shot of sleek wireless headphones on a matte black surface with soft gradient studio lighting',
    icon: CameraIcon,
  },
  {
    label: 'Watercolor landscape',
    prompt:
      'Create a delicate watercolor painting of a misty mountain lake at sunrise with soft pastel pinks and golds',
    icon: PenIcon,
  },
  {
    label: 'Logo design',
    prompt:
      'Design a clean minimalist logo mark for a modern technology company, using geometric shapes and a bold color accent',
    icon: StarIcon,
  },
  {
    label: 'Abstract composition',
    prompt:
      'Create an abstract fluid art composition with deep ocean blues, liquid gold, and ivory white swirling together in organic forms',
    icon: LayersIcon,
  },
  {
    label: 'Futuristic cityscape',
    prompt:
      'Create a futuristic neon-lit cityscape at night with rain-soaked streets reflecting colorful signs and towering skyscrapers',
    icon: EyeIcon,
  },
];

/**
 * Full-page gallery view for all generated images.
 */
export default function ImageGalleryView() {
  const dispatch = useDispatch();
  const [images, setImages] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const promptInputRef = useRef(null);
  const filterRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  const loadImages = useCallback(() => {
    setImages(getGeneratedImages());
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDelete = (imageId) => {
    deleteGeneratedImage(imageId);
    setDeleteConfirm(null);
    loadImages();
  };

  const handleDownload = async (img) => {
    const filename = `araviel-${img.id || Date.now()}.png`;
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Cross-origin fallback: draw to canvas and export as blob
      try {
        const blob = await new Promise((resolve, reject) => {
          const imgEl = new Image();
          imgEl.crossOrigin = 'anonymous';
          imgEl.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = imgEl.naturalWidth;
            canvas.height = imgEl.naturalHeight;
            canvas.getContext('2d').drawImage(imgEl, 0, 0);
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
              'image/png'
            );
          };
          imgEl.onerror = reject;
          imgEl.src = img.url;
        });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(img.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const firePromptInChat = (prompt) => {
    dispatch(createNewChat());
    dispatch(setInputValue(prompt));
    dispatch(setPendingAutoSubmit(true));
    dispatch(setActiveItem('home'));
  };

  const handlePromptInputChange = (e) => {
    setPromptInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handlePromptKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit(e);
    }
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    const prompt = promptInput.trim();
    if (!prompt) return;
    setPromptInput('');
    firePromptInChat(prompt);
  };

  const handleFileSelect = (e) => {
    // For now just focus the input — file attachment is handled through main chat
    setShowAttachMenu(false);
    if (e?.target?.files?.length) {
      // Could be extended to attach files before sending
    }
  };

  const handleQuickPromptClick = (item) => {
    setPromptInput(item.prompt);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
      // Auto-resize textarea to fit content
      const el = promptInputRef.current;
      el.style.height = 'auto';
      setTimeout(() => {
        el.style.height = el.scrollHeight + 'px';
      }, 0);
    }
  };

  const limitInfo = getLimitInfo();
  const tier = getUserTier();
  const uniqueModels = [...new Set(images.map((img) => img.model).filter(Boolean))];
  const filteredImages =
    filterModel === 'all' ? images : images.filter((img) => img.model === filterModel);

  return (
    <div className={styles.galleryPage}>
      <div className={styles.galleryInner}>
        {/* Hero */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Create something new</h1>
          <p className={styles.heroSubtitle}>Describe what you imagine and bring it to life</p>

          <form className={styles.promptForm} onSubmit={handlePromptSubmit}>
            <div className={styles.promptInputWrapper}>
              <textarea
                ref={promptInputRef}
                className={styles.promptInput}
                placeholder="Describe an image..."
                value={promptInput}
                onChange={handlePromptInputChange}
                onKeyDown={handlePromptKeyDown}
                rows={1}
              />
              <div className={styles.promptActions}>
                <div className={styles.promptActionsLeft} ref={attachMenuRef}>
                  <button
                    type="button"
                    className={`${styles.promptAttachBtn} ${
                      showAttachMenu ? styles.promptAttachBtnActive : ''
                    }`}
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    aria-label="Add content"
                  >
                    <PlusIcon />
                  </button>
                  {showAttachMenu && (
                    <div className={styles.promptAttachMenu}>
                      <button
                        className={styles.promptAttachOption}
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                      >
                        <PhotoIcon />
                        <span>Upload image or file</span>
                      </button>
                      {isMobile && (
                        <button
                          className={styles.promptAttachOption}
                          onClick={() => {
                            setShowAttachMenu(false);
                            // Open camera on mobile
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.click();
                          }}
                        >
                          <CameraIcon />
                          <span>Take a photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className={`${styles.promptSubmitBtn} ${
                    promptInput.trim() ? styles.promptSubmitBtnActive : ''
                  }`}
                  disabled={!promptInput.trim()}
                  aria-label="Generate image"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
              className={styles.hiddenFileInput}
              onChange={handleFileSelect}
            />
          </form>

          {/* Usage pill */}
          <div className={styles.usagePill}>
            <span className={styles.usagePillDot} />
            <span className={styles.usagePillText}>
              {limitInfo.remaining} of {limitInfo.limit} left
            </span>
            <span className={styles.usagePillBadge}>{tier === 'pro' ? 'PRO' : 'FREE'}</span>
            {limitInfo.isAtLimit && (
              <span className={styles.usagePillLimit}>
                {tier === 'free' ? 'Upgrade for more' : 'Resets soon'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Prompts — structured 2-column grid like ChatGPT */}
        <div className={styles.quickSection}>
          <h2 className={styles.quickTitle}>Try something new</h2>
          <div className={styles.quickGrid}>
            {QUICK_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  className={styles.quickItem}
                  onClick={() => handleQuickPromptClick(item)}
                >
                  <span className={styles.quickItemIcon}>
                    <Icon />
                  </span>
                  <span className={styles.quickItemLabel}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery */}
        {(filteredImages.length > 0 || images.length > 0) && (
          <>
            <div className={styles.galleryHeader}>
              <h2 className={styles.galleryTitle}>Your creations</h2>
              {filteredImages.length > 0 && (
                <span className={styles.imageCount}>{filteredImages.length}</span>
              )}
              <div className={styles.galleryHeaderSpacer} />
              {uniqueModels.length > 0 && (
                <div className={styles.filterWrapper} ref={filterRef}>
                  <button
                    className={`${styles.filterBtn} ${
                      filterModel !== 'all' ? styles.filterBtnActive : ''
                    }`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FilterIcon />
                    <span className={styles.filterBtnLabel}>
                      {filterModel === 'all' ? 'All models' : filterModel}
                    </span>
                    <ChevronDownIcon />
                  </button>
                  {showFilters && (
                    <div className={styles.filterDropdown}>
                      <div className={styles.filterDropdownHeader}>Filter by model</div>
                      <button
                        className={`${styles.filterOption} ${
                          filterModel === 'all' ? styles.filterOptionActive : ''
                        }`}
                        onClick={() => {
                          setFilterModel('all');
                          setShowFilters(false);
                        }}
                      >
                        <span className={styles.filterOptionLabel}>All models</span>
                        {filterModel === 'all' && (
                          <span className={styles.filterCheck}>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>
                      {uniqueModels.map((model) => (
                        <button
                          key={model}
                          className={`${styles.filterOption} ${
                            filterModel === model ? styles.filterOptionActive : ''
                          }`}
                          onClick={() => {
                            setFilterModel(model);
                            setShowFilters(false);
                          }}
                        >
                          <span className={styles.filterOptionLabel}>{model}</span>
                          {filterModel === model && (
                            <span className={styles.filterCheck}>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {filteredImages.length > 0 ? (
              <div className={styles.grid}>
                {filteredImages.map((img, idx) => (
                  <div key={img.id} className={styles.card}>
                    <div className={styles.cardImageWrapper}>
                      <button className={styles.cardImage} onClick={() => setLightboxIdx(idx)}>
                        <img src={img.url} alt={img.prompt || 'Generated image'} loading="lazy" />
                      </button>
                      <div className={styles.cardOverlay}>
                        <div className={styles.cardOverlayTop}>
                          {img.model && <span className={styles.cardModelLabel}>{img.model}</span>}
                        </div>
                        <div className={styles.cardOverlayBottom}>
                          <button
                            className={styles.cardOverlayBtn}
                            onClick={() => setLightboxIdx(idx)}
                            title="View full size"
                          >
                            <MaximizeIcon />
                          </button>
                          <button
                            className={styles.cardOverlayBtn}
                            onClick={() => handleDownload(img)}
                            title="Download"
                          >
                            <FileDownIcon />
                          </button>
                        </div>
                      </div>
                    </div>

                    {deleteConfirm === img.id && (
                      <div className={styles.deleteOverlay}>
                        <p>Delete this image?</p>
                        <div className={styles.deleteActions}>
                          <button
                            className={styles.deleteCancelBtn}
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className={styles.deleteConfirmBtn}
                            onClick={() => handleDelete(img.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No images match this filter.</p>
                <button className={styles.clearFilterBtn} onClick={() => setFilterModel('all')}>
                  Show all
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state — only when no images at all */}
        {images.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No images yet</h3>
            <p className={styles.emptyDesc}>
              Describe what you want to see above, or pick a quick prompt to get started.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null &&
        createPortal(
          <ImageDetailView
            images={filteredImages}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onDownload={handleDownload}
            onDelete={(id) => {
              handleDelete(id);
              setLightboxIdx(null);
            }}
          />,
          document.body
        )}
    </div>
  );
}

/**
 * Fullscreen image detail view with navigation and metadata.
 */
function ImageDetailView({ images, startIndex, onClose, onDownload, onDelete }) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const img = images[currentIdx];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setCurrentIdx((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIdx < images.length - 1) setCurrentIdx((i) => i + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, currentIdx, images.length]);

  if (!img) return null;

  const providerData = img.provider ? PROVIDERS[img.provider] : null;

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailTopBar}>
          <div className={styles.detailTopBarLeft}>
            {img.model && (
              <span className={styles.detailModelBadge}>
                {providerData && (
                  <span
                    className={styles.detailModelDot}
                    style={{ background: providerData.accentColor }}
                  />
                )}
                {img.model}
              </span>
            )}
            {images.length > 1 && (
              <span className={styles.detailCounter}>
                {currentIdx + 1} / {images.length}
              </span>
            )}
          </div>
          <div className={styles.detailTopBarRight}>
            <button className={styles.detailActionBtn} onClick={() => onDownload(img)} title="Save">
              <FileDownIcon />
              <span>Save</span>
            </button>
            <button
              className={styles.detailDeleteBtn}
              onClick={() => onDelete(img.id)}
              title="Delete"
              aria-label="Delete"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button className={styles.detailCloseBtn} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className={styles.detailImageArea}>
          {images.length > 1 && currentIdx > 0 && (
            <button
              className={`${styles.detailNav} ${styles.detailNavLeft}`}
              onClick={() => setCurrentIdx((i) => i - 1)}
              aria-label="Previous"
            >
              <ChevronLeftIcon />
            </button>
          )}
          <div className={styles.detailImageWrapper}>
            <img
              key={img.id}
              src={img.url}
              alt={img.prompt || 'Generated image'}
              className={styles.detailImage}
            />
          </div>
          {images.length > 1 && currentIdx < images.length - 1 && (
            <button
              className={`${styles.detailNav} ${styles.detailNavRight}`}
              onClick={() => setCurrentIdx((i) => i + 1)}
              aria-label="Next"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>

        {(img.prompt || img.provider) && (
          <div className={styles.detailInfoPanel}>
            {img.prompt && <p className={styles.detailFullPrompt}>{img.prompt}</p>}
            <div className={styles.detailMetaRow}>
              {img.provider && (
                <span className={styles.detailMetaChip}>{providerData?.name || img.provider}</span>
              )}
              {img.size && <span className={styles.detailMetaChip}>{img.size}</span>}
              <span className={styles.detailMetaChip}>
                {new Date(img.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
