import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  getGeneratedImages,
  deleteGeneratedImage,
  getLimitInfo,
} from '../../services/imageGeneration';
import { getUserTier } from '../../data/models';
import { CloseIcon, FileDownIcon } from '../Icons';
import styles from './ImageGalleryView.module.css';

/**
 * Full-page gallery view for all generated images.
 */
export default function ImageGalleryView() {
  const [images, setImages] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadImages = useCallback(() => {
    setImages(getGeneratedImages());
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

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

  const limitInfo = getLimitInfo();
  const tier = getUserTier();

  return (
    <div className={styles.galleryPage}>
      <div className={styles.galleryInner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Generated Images</h1>
            <span className={styles.count}>{images.length}</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.limitBadge}>
              <span className={styles.limitLabel}>
                {limitInfo.remaining}/{limitInfo.limit} remaining today
              </span>
              <span className={styles.tierBadge}>{tier === 'pro' ? 'Pro' : 'Free'}</span>
            </div>
          </div>
        </div>

        {/* Limit info bar */}
        {limitInfo.isAtLimit && (
          <div className={styles.limitBar}>
            <div className={styles.limitBarContent}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                {tier === 'free'
                  ? 'You\u2019ve used all free image generations today. Upgrade to Pro for 10 images per day.'
                  : 'Daily limit reached. Purchase the Image Generation add-on for additional usage.'}
              </span>
            </div>
            <button className={styles.limitBarBtn}>
              {tier === 'free' ? 'Upgrade to Pro' : 'Get Add-on'}
            </button>
          </div>
        )}

        {/* Gallery grid */}
        {images.length > 0 ? (
          <div className={styles.grid}>
            {images.map((img, idx) => (
              <div key={img.id} className={styles.card}>
                <button className={styles.cardImage} onClick={() => setLightboxIdx(idx)}>
                  <img src={img.url} alt={img.prompt || 'Generated image'} loading="lazy" />
                </button>
                <div className={styles.cardMeta}>
                  {img.prompt && (
                    <p className={styles.cardPrompt} title={img.prompt}>
                      {img.prompt}
                    </p>
                  )}
                  <div className={styles.cardFooter}>
                    <div className={styles.cardInfo}>
                      {img.model && <span className={styles.cardModel}>{img.model}</span>}
                      <span className={styles.cardDate}>
                        {new Date(img.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.cardActionBtn}
                        onClick={() => handleDownload(img)}
                        title="Download"
                        aria-label="Download image"
                      >
                        <FileDownIcon />
                      </button>
                      <button
                        className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
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
              Images you generate with AI will appear here. Select an image generation model and
              describe what you want to create.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null &&
        createPortal(
          <GalleryLightbox
            images={images}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onDownload={handleDownload}
          />,
          document.body
        )}
    </div>
  );
}

/**
 * Lightbox for viewing a single image from the gallery.
 */
function GalleryLightbox({ images, startIndex, onClose, onDownload }) {
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

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={styles.lightboxImageWrap}>
          {images.length > 1 && currentIdx > 0 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNavLeft}`}
              onClick={() => setCurrentIdx((i) => i - 1)}
              aria-label="Previous"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <img src={img.url} alt={img.prompt || 'Generated image'} className={styles.lightboxImg} />
          {images.length > 1 && currentIdx < images.length - 1 && (
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNavRight}`}
              onClick={() => setCurrentIdx((i) => i + 1)}
              aria-label="Next"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {img.prompt && <p className={styles.lightboxCaption}>{img.prompt}</p>}

        <div className={styles.lightboxFooter}>
          {img.model && <span className={styles.lightboxModel}>{img.model}</span>}
          {images.length > 1 && (
            <span className={styles.lightboxCounter}>
              {currentIdx + 1} / {images.length}
            </span>
          )}
          <button
            className={styles.lightboxDownload}
            onClick={() => onDownload(img)}
            title="Download"
          >
            <FileDownIcon />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
