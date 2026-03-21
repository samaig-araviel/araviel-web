import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import {
  setInputValue,
  createNewChat,
  setPendingAutoSubmit,
  setPendingModality,
  selectCreditBalance,
  selectImageQuality,
  setImageQuality,
  setCreditBalance,
} from '../../store/slices/chatSlice';
import { AuthModal } from '../Auth';
import {
  hasReachedGuestImageLimit,
  incrementGuestImageCount,
  getRemainingGuestImages,
} from '../../utils/guestSession';
import { fetchCreditBalance } from '../../services/credits';
import { IMAGE_QUALITY_OPTIONS } from '../../config/credits';
import CreditBalance from '../CreditBalance/CreditBalance';
import BuyPacksModal from '../BuyPacksModal/BuyPacksModal';
import {
  getGeneratedImages,
  fetchGeneratedImagesFromAPI,
  deleteGeneratedImage,
  getLimitInfo,
} from '../../services/imageGeneration';
import { getUserTier, PROVIDERS } from '../../data/models';
import {
  CloseIcon,
  FileDownIcon,
  FilterIcon,
  SendIcon,
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
  TrashIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
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
  const creditBalance = useSelector(selectCreditBalance);
  const imageQuality = useSelector(selectImageQuality);
  const [images, setImages] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showBuyPacks, setShowBuyPacks] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const promptInputRef = useRef(null);
  const filterRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  const loadImagesRef = useRef(null);
  const loadImages = useCallback(async () => {
    // Show cached images immediately, then fetch fresh from API
    const cached = getGeneratedImages();
    if (cached.length > 0) setImages(cached);
    try {
      const fresh = await fetchGeneratedImagesFromAPI();
      setImages(fresh);
    } catch {
      // Keep cached images on failure
    }
  }, []);
  loadImagesRef.current = loadImages;

  // Fetch credit balance on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCreditBalance()
      .then((data) => {
        if (data.balance) dispatch(setCreditBalance(data.balance));
      })
      .catch(() => {});
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadImages();
    }

    // Refresh gallery when new images are saved (e.g. from chat)
    // Use a small debounce to handle rapid successive saves
    let debounceTimer = null;
    const handleImageSaved = () => {
      clearTimeout(debounceTimer);
      // Show the new image immediately from cache, then refresh from API
      const cached = getGeneratedImages();
      if (cached.length > 0) setImages(cached);
      debounceTimer = setTimeout(() => loadImagesRef.current(), 500);
    };
    window.addEventListener('araviel-image-saved', handleImageSaved);

    // Also refresh when tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadImagesRef.current();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('araviel-image-saved', handleImageSaved);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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

  const handleDelete = async (imageId) => {
    await deleteGeneratedImage(imageId);
    setDeleteConfirm(null);
    // Optimistically remove from local state
    setImages((prev) => prev.filter((img) => img.id !== imageId));
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
    // Guest image limit check
    if (!isAuthenticated && hasReachedGuestImageLimit()) {
      setShowAuthModal(true);
      return;
    }
    // Track guest image usage
    if (!isAuthenticated) {
      incrementGuestImageCount();
    }
    dispatch(createNewChat());
    dispatch(setInputValue(prompt));
    dispatch(setPendingModality('image'));
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
    // Allow guests to preview the prompt — gate happens on submit
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
            {/* Guest image limit banner */}
            {!isAuthenticated && !hasReachedGuestImageLimit() && getRemainingGuestImages() === 1 && (
              <div className={styles.guestBanner}>
                <span className={styles.guestBannerText}>1 free image creation</span>
                <span className={styles.guestBannerDot} />
                <button type="button" className={styles.guestBannerLink} onClick={() => setShowAuthModal(true)}>
                  Sign up for more
                </button>
              </div>
            )}
            {!isAuthenticated && hasReachedGuestImageLimit() && (
              <div className={`${styles.guestBanner} ${styles.guestBannerUrgent}`}>
                <span className={styles.guestBannerText}>Free image creation used</span>
                <span className={styles.guestBannerDot} />
                <button type="button" className={styles.guestBannerLink} onClick={() => setShowAuthModal(true)}>
                  Sign up to create more
                </button>
              </div>
            )}
            <div className={`${styles.promptInputWrapper} ${
              !isAuthenticated && (getRemainingGuestImages() <= 1 || hasReachedGuestImageLimit())
                ? styles.promptInputWrapperWithBanner
                : ''
            }`}>
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
                  <select
                    className={styles.qualitySelect}
                    value={imageQuality}
                    onChange={(e) => dispatch(setImageQuality(e.target.value))}
                  >
                    {IMAGE_QUALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.cost}cr)
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.promptActionsRight}>
                  <ModelSelector imageOnly />
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

          {/* Credit balance */}
          <div className={styles.usagePill}>
            <CreditBalance onBuyCredits={() => setShowBuyPacks(true)} />
            <span className={styles.usagePillBadge}>
              {creditBalance?.tier === 'pro'
                ? 'PRO'
                : creditBalance?.tier === 'lite'
                ? 'LITE'
                : 'FREE'}
            </span>
          </div>
          {showBuyPacks && <BuyPacksModal onClose={() => setShowBuyPacks(false)} />}
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
                        <img
                          src={img.url}
                          alt={img.prompt || 'Generated image'}
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add(styles.cardImageBroken);
                          }}
                        />
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
 * Fullscreen image detail view with thumbnail sidebar and large preview.
 * Thumbnails on the left, selected image large in the center.
 */
function ImageDetailView({ images, startIndex, onClose, onDownload, onDelete }) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const thumbListRef = useRef(null);
  const activeThumbRef = useRef(null);

  const img = images[activeIndex];
  const providerData = img?.provider ? PROVIDERS[img.provider] : null;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteWarning) {
          setShowDeleteWarning(false);
        } else {
          onClose();
        }
      }
      if (!showDeleteWarning) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, images.length, showDeleteWarning]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  if (!img) return null;

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailContainer} onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className={styles.detailTopBar}>
          <div className={styles.detailTopBarLeft}>
            {img.model && (
              <span
                className={styles.detailModelBadge}
                style={providerData ? { borderColor: providerData.accentColor + '40' } : undefined}
              >
                {providerData && (
                  <span
                    className={styles.detailModelDot}
                    style={{ background: providerData.accentColor }}
                  />
                )}
                {img.model}
              </span>
            )}
          </div>
          <div className={styles.detailTopBarRight}>
            <button
              className={styles.detailActionBtn}
              onClick={() => onDownload(img)}
              title="Save image"
            >
              <FileDownIcon />
              <span>Save</span>
            </button>
            <button
              className={styles.detailDeleteBtn}
              onClick={() => setShowDeleteWarning(true)}
              title="Delete"
              aria-label="Delete"
            >
              <TrashIcon />
            </button>
            <button className={styles.detailCloseBtn} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Main area: sidebar + image */}
        <div className={styles.detailMain}>
          {/* Thumbnail sidebar — only shown when multiple images */}
          {images.length > 1 && (
            <div className={styles.detailSidebar} ref={thumbListRef}>
              {images.map((thumb, idx) => (
                <button
                  key={thumb.id || idx}
                  ref={idx === activeIndex ? activeThumbRef : null}
                  className={`${styles.detailThumb} ${
                    idx === activeIndex ? styles.detailThumbActive : ''
                  }`}
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={thumb.url}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.opacity = '0.3';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className={styles.detailBody}>
            <img
              key={activeIndex}
              src={img.url}
              alt={img.prompt || 'Generated image'}
              className={styles.detailImage}
              onError={(e) => {
                e.target.style.opacity = '0.2';
              }}
            />
          </div>
        </div>

        {/* Footer: prompt + meta */}
        <div className={styles.detailFooter}>
          {img.prompt && <p className={styles.detailPromptText}>{img.prompt}</p>}
          <div className={styles.detailMetaRow}>
            {img.provider && (
              <span className={styles.detailMetaChip}>{providerData?.name || img.provider}</span>
            )}
            {img.size && <span className={styles.detailMetaChip}>{img.size}</span>}
            {images.length > 1 && (
              <span className={styles.detailMetaChip}>
                {activeIndex + 1} of {images.length}
              </span>
            )}
            <span className={styles.detailMetaChip}>
              {new Date(img.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteWarning && (
          <div className={styles.deleteWarningOverlay} onClick={() => setShowDeleteWarning(false)}>
            <div className={styles.deleteWarningDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.deleteWarningIcon}>
                <TrashIcon />
              </div>
              <h3 className={styles.deleteWarningTitle}>Delete this image?</h3>
              <p className={styles.deleteWarningDesc}>
                This image will be permanently removed from your gallery. This action cannot be
                undone.
              </p>
              <div className={styles.deleteWarningActions}>
                <button
                  className={styles.deleteWarningCancel}
                  onClick={() => setShowDeleteWarning(false)}
                >
                  Cancel
                </button>
                <button
                  className={styles.deleteWarningConfirm}
                  onClick={() => {
                    setShowDeleteWarning(false);
                    onDelete(img.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest auth modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab="signup"
      />
    </div>
  );
}
