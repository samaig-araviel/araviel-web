import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { setInputValue } from '../../store/slices/chatSlice';
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
  SearchIcon,
  SparkleIcon,
  SendIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MaximizeIcon,
} from '../Icons';
import styles from './ImageGalleryView.module.css';

const QUICK_PROMPT_SETS = [
  {
    category: 'Trending',
    icon: '🔥',
    prompts: [
      { text: 'A hyper-realistic portrait with cinematic lighting', tag: 'Portrait' },
      { text: 'Futuristic neon cityscape at night with rain reflections', tag: 'Sci-fi' },
      { text: 'Minimalist flat design logo for a tech startup', tag: 'Logo' },
      { text: 'Ethereal fantasy landscape with floating islands and auroras', tag: 'Fantasy' },
    ],
  },
  {
    category: 'Artistic',
    icon: '🎨',
    prompts: [
      { text: 'Oil painting of a stormy ocean with dramatic waves', tag: 'Oil paint' },
      { text: 'Watercolor illustration of a cozy Japanese café', tag: 'Watercolor' },
      { text: 'Abstract geometric composition in gold and navy tones', tag: 'Abstract' },
      { text: 'Pixel art scene of a retro space adventure game', tag: 'Pixel art' },
    ],
  },
  {
    category: 'Photography',
    icon: '📷',
    prompts: [
      { text: 'Product shot of premium headphones on a dark surface', tag: 'Product' },
      { text: 'Golden hour portrait of a person walking through lavender fields', tag: 'Portrait' },
      { text: 'Architectural photography of a modern glass building', tag: 'Architecture' },
      { text: 'Macro photography of dew drops on a spider web at sunrise', tag: 'Macro' },
    ],
  },
  {
    category: 'Design',
    icon: '✏️',
    prompts: [
      { text: 'Clean mobile app UI design for a meditation app', tag: 'UI' },
      { text: 'Isometric 3D illustration of a smart home setup', tag: '3D' },
      { text: 'Book cover design for a sci-fi novel about AI consciousness', tag: 'Cover' },
      { text: 'Brand identity mockup with business cards and letterhead', tag: 'Branding' },
    ],
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
  const [activeCategory, setActiveCategory] = useState(0);
  const promptInputRef = useRef(null);
  const filterRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDelete = (imageId) => {
    deleteGeneratedImage(imageId);
    setDeleteConfirm(null);
    loadImages();
  };

  const handleDownload = (img) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `araviel-${img.id}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateToChat = (prompt) => {
    dispatch(setInputValue(prompt));
    dispatch(setActiveItem('home'));
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    const prompt = promptInput.trim();
    if (!prompt) return;
    navigateToChat(prompt);
  };

  const handleQuickPromptClick = (prompt) => {
    navigateToChat(prompt);
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
          <div className={styles.heroBadge}>
            <SparkleIcon />
            <span>AI Image Generation</span>
          </div>
          <h1 className={styles.heroTitle}>Create stunning images</h1>
          <p className={styles.heroSubtitle}>
            Describe what you imagine and let AI bring it to life
          </p>

          <form className={styles.promptForm} onSubmit={handlePromptSubmit}>
            <div className={styles.promptInputWrapper}>
              <SearchIcon />
              <input
                ref={promptInputRef}
                type="text"
                className={styles.promptInput}
                placeholder="Describe an image you want to create..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
              />
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
          </form>

          <div className={styles.usageRow}>
            <span className={styles.usageText}>
              {limitInfo.remaining} of {limitInfo.limit} generations left
            </span>
            <span className={styles.usageDot} />
            <span className={styles.tierLabel}>{tier === 'pro' ? 'Pro' : 'Free'}</span>
            {limitInfo.isAtLimit && (
              <span className={styles.usageLimitNote}>
                {tier === 'free' ? 'Upgrade for more' : 'Resets soon'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Prompts */}
        <div className={styles.quickSection}>
          <div className={styles.quickTabs}>
            {QUICK_PROMPT_SETS.map((set, idx) => (
              <button
                key={set.category}
                className={`${styles.quickTab} ${
                  activeCategory === idx ? styles.quickTabActive : ''
                }`}
                onClick={() => setActiveCategory(idx)}
              >
                <span className={styles.quickTabIcon}>{set.icon}</span>
                <span>{set.category}</span>
              </button>
            ))}
          </div>
          <div className={styles.quickGrid}>
            {QUICK_PROMPT_SETS[activeCategory].prompts.map((item, idx) => (
              <button
                key={idx}
                className={styles.quickCard}
                onClick={() => handleQuickPromptClick(item.text)}
              >
                <span className={styles.quickCardTag}>{item.tag}</span>
                <span className={styles.quickCardText}>{item.text}</span>
                <span className={styles.quickCardArrow}>
                  <SendIcon />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className={styles.galleryHeader}>
          <div className={styles.galleryHeaderLeft}>
            <h2 className={styles.galleryTitle}>Your creations</h2>
            {filteredImages.length > 0 && (
              <span className={styles.imageCount}>{filteredImages.length}</span>
            )}
          </div>
          {uniqueModels.length > 0 && (
            <div className={styles.galleryHeaderRight} ref={filterRef}>
              <button
                className={`${styles.filterBtn} ${
                  filterModel !== 'all' ? styles.filterBtnActive : ''
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon />
                <span>{filterModel === 'all' ? 'All models' : filterModel}</span>
              </button>
              {showFilters && (
                <div className={styles.filterDropdown}>
                  <button
                    className={`${styles.filterOption} ${
                      filterModel === 'all' ? styles.filterOptionActive : ''
                    }`}
                    onClick={() => {
                      setFilterModel('all');
                      setShowFilters(false);
                    }}
                  >
                    All models
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
                      {model}
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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width="36"
                height="36"
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
              Type a description above or try one of the quick prompts to get started.
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
