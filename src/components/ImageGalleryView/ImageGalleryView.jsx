import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  CalendarIcon,
  MaximizeIcon,
} from '../Icons';
import styles from './ImageGalleryView.module.css';

const IMAGE_QUICK_PROMPTS = [
  {
    category: 'Portraits',
    prompts: [
      'A professional headshot of a confident businessperson in a modern office with natural lighting',
      'An artistic watercolor portrait of a musician playing guitar under city lights at night',
      'A cinematic close-up portrait with dramatic rim lighting and a moody dark background',
    ],
  },
  {
    category: 'Landscapes',
    prompts: [
      'A breathtaking aerial view of misty mountains at sunrise with golden light streaming through clouds',
      'A serene Japanese garden in autumn with a red maple tree reflected in a still pond',
      'A futuristic city skyline at twilight with neon lights reflecting off glass towers',
    ],
  },
  {
    category: 'Abstract & Art',
    prompts: [
      'An abstract fluid art composition with deep blues, golds, and whites swirling together',
      'A minimalist geometric art piece with clean lines and a muted earth-tone palette',
      'A surreal dreamscape with floating islands, waterfalls pouring into clouds, and bioluminescent plants',
    ],
  },
  {
    category: 'Product & Design',
    prompts: [
      'A sleek product photography shot of a premium smartwatch on a marble surface with soft studio lighting',
      'A flat lay arrangement of design tools, sketchbooks, and coffee on a wooden desk',
      'A clean mockup of a mobile app interface displayed on the latest iPhone with a gradient background',
    ],
  },
];

/**
 * Full-page gallery view for all generated images.
 */
export default function ImageGalleryView() {
  const [images, setImages] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [activeQuickCategory, setActiveQuickCategory] = useState(0);
  const promptInputRef = useRef(null);
  const filterRef = useRef(null);

  const loadImages = useCallback(() => {
    setImages(getGeneratedImages());
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Close filters on click outside
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

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    const prompt = promptInput.trim();
    if (!prompt) return;
    // Navigate to chat with the prompt pre-filled — for now just copy to clipboard
    // In a full implementation this would dispatch to the chat view
    navigator.clipboard.writeText(prompt);
    setPromptInput('');
  };

  const handleQuickPromptClick = (prompt) => {
    setPromptInput(prompt);
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  };

  const limitInfo = getLimitInfo();
  const tier = getUserTier();

  // Get unique models for filter
  const uniqueModels = [...new Set(images.map((img) => img.model).filter(Boolean))];

  // Filtered images
  const filteredImages =
    filterModel === 'all' ? images : images.filter((img) => img.model === filterModel);

  return (
    <div className={styles.galleryPage}>
      <div className={styles.galleryInner}>
        {/* Hero Section with Prompt Input */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Images</h1>
          <p className={styles.heroSubtitle}>
            Create, explore, and manage your AI-generated images
          </p>

          <form className={styles.promptForm} onSubmit={handlePromptSubmit}>
            <div className={styles.promptInputWrapper}>
              <SparkleIcon />
              <input
                ref={promptInputRef}
                type="text"
                className={styles.promptInput}
                placeholder="Describe a new image..."
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

          {/* Usage info */}
          <div className={styles.usageBar}>
            <div className={styles.usageInfo}>
              <span className={styles.usageLabel}>
                {limitInfo.remaining}/{limitInfo.limit} generations remaining
              </span>
              <span className={styles.tierPill}>{tier === 'pro' ? 'Pro' : 'Free'}</span>
            </div>
            {limitInfo.isAtLimit && (
              <span className={styles.usageLimitNote}>
                {tier === 'free'
                  ? 'Upgrade to Pro for 10 daily generations'
                  : 'Daily limit reached — resets soon'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Prompts Carousel */}
        <div className={styles.quickPromptsSection}>
          <div className={styles.quickPromptsHeader}>
            <h2 className={styles.quickPromptsTitle}>Try a prompt</h2>
            <div className={styles.quickPromptsTabs}>
              {IMAGE_QUICK_PROMPTS.map((cat, idx) => (
                <button
                  key={cat.category}
                  className={`${styles.quickPromptsTab} ${
                    activeQuickCategory === idx ? styles.quickPromptsTabActive : ''
                  }`}
                  onClick={() => setActiveQuickCategory(idx)}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.quickPromptsGrid}>
            {IMAGE_QUICK_PROMPTS[activeQuickCategory].prompts.map((prompt, idx) => (
              <button
                key={idx}
                className={styles.quickPromptCard}
                onClick={() => handleQuickPromptClick(prompt)}
              >
                <span className={styles.quickPromptText}>{prompt}</span>
                <span className={styles.quickPromptAction}>Use prompt</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Header with Filters */}
        <div className={styles.galleryHeader}>
          <div className={styles.galleryHeaderLeft}>
            <h2 className={styles.galleryTitle}>Your Images</h2>
            <span className={styles.imageCount}>{filteredImages.length}</span>
          </div>
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
        </div>

        {/* Gallery Grid */}
        {filteredImages.length > 0 ? (
          <div className={styles.grid}>
            {filteredImages.map((img, idx) => (
              <div key={img.id} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  <button className={styles.cardImage} onClick={() => setLightboxIdx(idx)}>
                    <img src={img.url} alt={img.prompt || 'Generated image'} loading="lazy" />
                  </button>
                  <div className={styles.cardImageOverlay}>
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
                <div className={styles.cardMeta}>
                  {img.prompt && (
                    <p className={styles.cardPrompt} title={img.prompt}>
                      {img.prompt}
                    </p>
                  )}
                  <div className={styles.cardFooter}>
                    <div className={styles.cardInfo}>
                      {img.model && <span className={styles.cardModelPill}>{img.model}</span>}
                      <span className={styles.cardDate}>
                        <CalendarIcon />
                        {new Date(img.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <button
                      className={styles.cardDeleteBtn}
                      onClick={() => setDeleteConfirm(img.id)}
                      title="Delete"
                      aria-label="Delete image"
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
                  </div>
                </div>

                {/* Delete confirmation */}
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
                width="40"
                height="40"
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
 * Beautiful image detail view — fullscreen lightbox with rich metadata.
 */
function ImageDetailView({ images, startIndex, onClose, onDownload, onDelete }) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const [showInfo, setShowInfo] = useState(true);
  const img = images[currentIdx];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setCurrentIdx((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIdx < images.length - 1) setCurrentIdx((i) => i + 1);
      if (e.key === 'i') setShowInfo((prev) => !prev);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, currentIdx, images.length]);

  if (!img) return null;

  const providerData = img.provider ? PROVIDERS[img.provider] : null;

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailContainer} onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className={styles.detailTopBar}>
          <div className={styles.detailTopBarLeft}>
            {img.prompt && (
              <span className={styles.detailPromptBadge} title={img.prompt}>
                {img.prompt.length > 60 ? img.prompt.slice(0, 60) + '...' : img.prompt}
              </span>
            )}
          </div>
          <div className={styles.detailTopBarRight}>
            {images.length > 1 && (
              <span className={styles.detailCounter}>
                {currentIdx + 1} / {images.length}
              </span>
            )}
            <button
              className={styles.detailActionBtn}
              onClick={() => onDownload(img)}
              title="Download"
            >
              <FileDownIcon />
              <span>Save</span>
            </button>
            <button className={styles.detailCloseBtn} onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Image area */}
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

        {/* Bottom info panel */}
        {showInfo && (
          <div className={styles.detailInfoPanel}>
            {img.prompt && <p className={styles.detailFullPrompt}>{img.prompt}</p>}
            <div className={styles.detailMetaRow}>
              {img.model && (
                <div className={styles.detailMetaItem}>
                  <span className={styles.detailMetaLabel}>Model</span>
                  <span
                    className={styles.detailMetaValue}
                    style={providerData ? { color: providerData.accentColor } : undefined}
                  >
                    {img.model}
                  </span>
                </div>
              )}
              {img.provider && (
                <div className={styles.detailMetaItem}>
                  <span className={styles.detailMetaLabel}>Provider</span>
                  <span className={styles.detailMetaValue}>
                    {providerData?.name || img.provider}
                  </span>
                </div>
              )}
              <div className={styles.detailMetaItem}>
                <span className={styles.detailMetaLabel}>Created</span>
                <span className={styles.detailMetaValue}>
                  {new Date(img.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {img.size && (
                <div className={styles.detailMetaItem}>
                  <span className={styles.detailMetaLabel}>Size</span>
                  <span className={styles.detailMetaValue}>{img.size}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
