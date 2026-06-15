import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { hasReachedGuestImageLimit, incrementGuestImageCount } from '../../utils/guestSession';
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
import { PROVIDERS } from '../../data/models';
import { selectCurrentTier, setImageCredits } from '../../store/slices/subscriptionSlice';
import {
  CloseIcon,
  FileDownIcon,
  FilterIcon,
  SendIcon,
  ChevronDownIcon,
  CheckIcon,
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
import MarkdownTextarea from '../MarkdownTextarea/MarkdownTextarea';
import useFileDrop from '../../hooks/useFileDrop';
import usePasteImages from '../../hooks/usePasteImages';
import DropOverlay from '../DropOverlay';
import { setPendingAttachments } from '../../utils/pendingAttachments';

const PAGE_SIZE = 9;

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
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeImageId } = useParams();
  const creditBalance = useSelector(selectCreditBalance);
  const imageQuality = useSelector(selectImageQuality);
  const [images, setImages] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterModel, setFilterModel] = useState('all');
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showBuyPacks, setShowBuyPacks] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const promptInputRef = useRef(null);
  const filterRef = useRef(null);
  const attachMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const qualityRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  // Ref to track current auth state — prevents stale closures in event listeners
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const loadImagesRef = useRef(null);
  const loadImages = useCallback(async () => {
    // Guard against stale calls after sign-out (e.g. from visibility change)
    if (!isAuthenticatedRef.current) return;
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

  // Fetch credit balance on mount and update both Redux slices.
  // This is the fallback for the navigate-away scenario: if the user left the chat
  // view before the done event arrived, this fetch runs after the charge is committed.
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCreditBalance()
      .then((data) => {
        if (data.balance) {
          dispatch(setCreditBalance(data.balance));
          dispatch(
            setImageCredits({
              used: data.balance.monthly?.used ?? 0,
              limit: data.balance.monthly?.total ?? 5,
              remaining: data.balance.monthly?.remaining ?? 0,
              packRemaining: data.balance.packs?.remaining ?? 0,
              cycleResetsAt: data.balance.cycleResetsAt ?? null,
            })
          );
        }
      })
      .catch(() => {});
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadImages();
    } else {
      // Clear stale images when user signs out
      setImages([]);
    }

    if (!isAuthenticated) return;

    // Refresh gallery when new images are saved from the chat view.
    // Credit numbers are NOT refreshed here — the done SSE event handles that
    // with the authoritative post-charge balance embedded by the server.
    let debounceTimer = null;
    const handleImageSaved = () => {
      clearTimeout(debounceTimer);
      const cached = getGeneratedImages();
      if (cached.length > 0) setImages(cached);
      debounceTimer = setTimeout(() => loadImagesRef.current(), 500);
    };
    window.addEventListener('araviel-image-saved', handleImageSaved);

    // Refresh both slices when the authoritative post-charge balance arrives.
    // Fired by MainContent after the done SSE event is processed.
    const handleCreditsUpdated = () => {
      fetchCreditBalance()
        .then((data) => {
          if (data?.balance) {
            dispatch(setCreditBalance(data.balance));
            dispatch(
              setImageCredits({
                used: data.balance.monthly?.used ?? 0,
                limit: data.balance.monthly?.total ?? 5,
                remaining: data.balance.monthly?.remaining ?? 0,
                packRemaining: data.balance.packs?.remaining ?? 0,
                cycleResetsAt: data.balance.cycleResetsAt ?? null,
              })
            );
          }
        })
        .catch(() => {});
    };
    window.addEventListener('araviel-credits-updated', handleCreditsUpdated);

    // Refresh gallery and credits when tab regains focus (handles long-away scenarios)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadImagesRef.current();
        handleCreditsUpdated();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('araviel-image-saved', handleImageSaved);
      window.removeEventListener('araviel-credits-updated', handleCreditsUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadImages, isAuthenticated, dispatch]);

  // Reset pagination when the filter changes — a fresh view starts with PAGE_SIZE cards.
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [filterModel]);

  // Handle deep link to specific image via route param
  useEffect(() => {
    if (routeImageId && images.length > 0) {
      const idx = images.findIndex((img) => img.id === routeImageId);
      if (idx !== -1) {
        // Ensure the target image is within the currently displayed slice
        setDisplayedCount((c) => (idx >= c ? Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE : c));
        setLightboxIdx(idx);
      }
    }
  }, [routeImageId, images]);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (qualityRef.current && !qualityRef.current.contains(e.target)) {
        setQualityOpen(false);
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
      navigate('/signup', { state: { from: location.pathname + location.search } });
      return;
    }
    // Track guest image usage
    if (!isAuthenticated) {
      incrementGuestImageCount();
    }
    // Capture quality before createNewChat resets it to 'standard'
    const qualityToUse = imageQuality;
    dispatch(createNewChat());
    dispatch(setImageQuality(qualityToUse));
    dispatch(setInputValue(prompt));
    dispatch(setPendingModality('image'));
    dispatch(setPendingAutoSubmit(true));
    navigate('/');
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

  const handleDroppedFiles = useCallback(
    (incoming) => {
      if (!incoming || incoming.length === 0) return;
      setShowAttachMenu(false);
      setPendingAttachments(incoming);
      const text = promptInput.trim();
      setPromptInput('');
      dispatch(createNewChat());
      dispatch(setInputValue(text));
      dispatch(setPendingAutoSubmit(true));
      navigate('/');
    },
    [promptInput, dispatch, navigate]
  );

  const dropTargetRef = useRef(null);
  const { isDragging } = useFileDrop(dropTargetRef, {
    onFiles: handleDroppedFiles,
    enabled: true,
  });
  usePasteImages({ onFiles: handleDroppedFiles, enabled: true });

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

  const tier = useSelector(selectCurrentTier);
  const limitInfo = getLimitInfo(tier);
  const uniqueModels = [...new Set(images.map((img) => img.model).filter(Boolean))];
  const filteredImages =
    filterModel === 'all' ? images : images.filter((img) => img.model === filterModel);
  const visibleImages = filteredImages.slice(0, displayedCount);
  const hasMore = filteredImages.length > displayedCount;
  const remaining = filteredImages.length - displayedCount;

  return (
    <div className={styles.galleryPage} ref={dropTargetRef}>
      <DropOverlay visible={isDragging} label="Drop image to attach" />
      <div className={styles.galleryInner}>
        {/* Hero */}
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Create something new</h1>
          <p className={styles.heroSubtitle}>Describe what you imagine and bring it to life</p>

          <form className={styles.promptForm} onSubmit={handlePromptSubmit}>
            <div className={styles.promptInputWrapper}>
              <MarkdownTextarea
                ref={promptInputRef}
                className={styles.promptInput}
                placeholder="Describe an image..."
                value={promptInput}
                onChange={handlePromptInputChange}
                onKeyDown={handlePromptKeyDown}
                rows={1}
                aria-label="Image prompt input"
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
                  <div className={styles.qualityDropdown} ref={qualityRef}>
                    <button
                      type="button"
                      className={`${styles.qualityTrigger} ${
                        qualityOpen ? styles.qualityTriggerOpen : ''
                      }`}
                      onClick={() => setQualityOpen(!qualityOpen)}
                    >
                      <span className={styles.qualityTriggerLabel}>
                        {IMAGE_QUALITY_OPTIONS.find((o) => o.value === imageQuality)?.label || 'SD'}
                      </span>
                      <span
                        className={`${styles.qualityTriggerChevron} ${
                          qualityOpen ? styles.qualityTriggerChevronOpen : ''
                        }`}
                      >
                        <ChevronDownIcon />
                      </span>
                    </button>
                    {qualityOpen && (
                      <div className={styles.qualityMenu}>
                        {IMAGE_QUALITY_OPTIONS.map((opt) => {
                          const isActive = imageQuality === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`${styles.qualityOption} ${
                                isActive ? styles.qualityOptionSelected : ''
                              }`}
                              onClick={() => {
                                dispatch(setImageQuality(opt.value));
                                setQualityOpen(false);
                              }}
                            >
                              <div className={styles.qualityOptionContent}>
                                <span className={styles.qualityOptionLabel}>{opt.label}</span>
                                <span className={styles.qualityOptionCost}>
                                  {opt.cost} credit{opt.cost > 1 ? 's' : ''} per image
                                </span>
                              </div>
                              {isActive && (
                                <span className={styles.qualityCheckmark}>
                                  <CheckIcon />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
            <CreditBalance
              tier={creditBalance?.tier ?? 'free'}
              onBuyCredits={() => {
                if (!isAuthenticated) {
                  navigate('/signup', {
                    state: { from: location.pathname + location.search },
                  });
                } else {
                  setShowBuyPacks(true);
                }
              }}
            />
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
                {visibleImages.map((img, idx) => {
                  // Only the most recent batch animates in — earlier cards stay put.
                  const isNewlyLoaded = idx >= displayedCount - PAGE_SIZE;
                  const cardClassName = isNewlyLoaded
                    ? `${styles.card} ${styles.cardEnter}`
                    : styles.card;
                  const cardStyle = isNewlyLoaded
                    ? { animationDelay: `${(idx % PAGE_SIZE) * 40}ms` }
                    : undefined;
                  return (
                    <div key={img.id} className={cardClassName} style={cardStyle}>
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
                            {img.model && (
                              <span className={styles.cardModelLabel}>{img.model}</span>
                            )}
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
                            <button
                              className={`${styles.cardOverlayBtn} ${styles.cardDeleteBtn}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(img.id);
                              }}
                              title="Delete"
                            >
                              <TrashIcon />
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
                  );
                })}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No images match this filter.</p>
                <button className={styles.clearFilterBtn} onClick={() => setFilterModel('all')}>
                  Show all
                </button>
              </div>
            )}

            {hasMore && (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  onClick={() => setDisplayedCount((c) => c + PAGE_SIZE)}
                >
                  <span className={styles.loadMoreLabel}>Load more</span>
                  <span className={styles.loadMoreCount}>
                    {Math.min(PAGE_SIZE, remaining)} of {remaining} remaining
                  </span>
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
            images={visibleImages}
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

        {/* Main area: sidebar + image + footer (footer is inside the image column so it centres against the image, not the full container) */}
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

          {/* Image column: image + footer stacked so footer aligns under the image */}
          <div className={styles.detailContent}>
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

            {/* Footer: prompt (scrollable) + meta */}
            <div className={styles.detailFooter}>
              {img.prompt && (
                <div className={styles.detailPromptScroll}>
                  <p className={styles.detailPromptText}>{img.prompt}</p>
                </div>
              )}
              <div className={styles.detailMetaRow}>
                {img.provider && (
                  <span className={styles.detailMetaChip}>
                    {providerData?.name || img.provider}
                  </span>
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
    </div>
  );
}
