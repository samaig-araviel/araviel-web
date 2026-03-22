import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectConversations,
  selectConversationsTotal,
  setCurrentChat,
  setMessages,
} from '../../store/slices/chatSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { selectProjects } from '../../store/slices/projectsSlice';
import { searchConversations, searchProjects, searchImages } from '../../services/api';
import { getGeneratedImages } from '../../services/imageGeneration';
import {
  SearchIcon,
  ChatIcon,
  ProjectsIcon,
  StarIcon,
  CalendarIcon,
  CloseIcon,
  PhotoIcon,
} from '../Icons';
import styles from './SearchModal.module.css';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'projects', label: 'Projects' },
  { key: 'images', label: 'Images' },
];

const DATE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7days', label: 'Last 7 days' },
  { key: '30days', label: 'Last 30 days' },
];

function getDateThreshold(key) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case 'today':
      return start;
    case '7days':
      start.setDate(start.getDate() - 7);
      return start;
    case '30days':
      start.setDate(start.getDate() - 30);
      return start;
    default:
      return null;
  }
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 365) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SearchModal({ onClose }) {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const projects = useSelector(selectProjects);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiConversations, setApiConversations] = useState(null);
  const [apiProjects, setApiProjects] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [images, setImages] = useState(() => getGeneratedImages() || []);
  const [apiImages, setApiImages] = useState(null);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Build project name lookup map
  const projectMap = useMemo(() => {
    const map = {};
    (projects || []).forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  // Determine if we need API search
  const needsApiSearch = conversations.length < conversationsTotal;

  // Debounced API search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setApiConversations(null);
      setApiProjects(null);
      setApiImages(null);
      setApiLoading(false);
      return;
    }

    setApiLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const promises = [];
        // Always search images via API (they aren't fully cached client-side)
        promises.push(searchImages(query.trim(), 12));

        if (needsApiSearch) {
          promises.push(searchConversations(query.trim()));
          promises.push(searchProjects(query.trim()));
        } else {
          promises.push(Promise.resolve(null));
          promises.push(Promise.resolve(null));
        }

        const [imgResult, convResult, projResult] = await Promise.all(promises);
        setApiImages(imgResult?.images || []);
        if (convResult) setApiConversations(convResult.conversations || []);
        if (projResult) setApiProjects(projResult.projects || []);
      } catch {
        // Silent fail — client-side results still available
      } finally {
        setApiLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, needsApiSearch]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (typeFilter === 'projects' || typeFilter === 'images') return [];

    const q = query.toLowerCase().trim();
    const dateThreshold = getDateThreshold(dateFilter);

    let source = conversations || [];

    if (apiConversations) {
      const existingIds = new Set(source.map((c) => c.id));
      const newFromApi = apiConversations.filter((c) => !existingIds.has(c.id));
      source = [...source, ...newFromApi];
    }

    return source.filter((conv) => {
      if (q && !conv.title?.toLowerCase().includes(q)) return false;
      if (dateThreshold) {
        const updated = new Date(conv.updatedAt || conv.updated_at);
        if (updated < dateThreshold) return false;
      }
      return true;
    });
  }, [conversations, apiConversations, query, typeFilter, dateFilter]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (typeFilter === 'conversations' || typeFilter === 'images') return [];

    const q = query.toLowerCase().trim();
    const dateThreshold = getDateThreshold(dateFilter);

    let source = projects || [];

    if (apiProjects) {
      const existingIds = new Set(source.map((p) => p.id));
      const newFromApi = apiProjects.filter((p) => !existingIds.has(p.id));
      source = [...source, ...newFromApi];
    }

    return source.filter((proj) => {
      if (q && !proj.name?.toLowerCase().includes(q)) return false;
      if (dateThreshold) {
        const updated = new Date(proj.updated_at);
        if (updated < dateThreshold) return false;
      }
      return true;
    });
  }, [projects, apiProjects, query, typeFilter, dateFilter]);

  // Filter images
  const filteredImages = useMemo(() => {
    if (typeFilter === 'conversations' || typeFilter === 'projects') return [];

    const q = query.toLowerCase().trim();
    const dateThreshold = getDateThreshold(dateFilter);

    // Use API results if searching, otherwise use local cache
    let source = q && apiImages ? apiImages : images;

    // For client-side filtering when not using API
    if (!q || !apiImages) {
      source = (images || []).filter((img) => {
        if (q && !img.prompt?.toLowerCase().includes(q)) return false;
        if (dateThreshold) {
          const created = new Date(img.createdAt || img.created_at);
          if (created < dateThreshold) return false;
        }
        return true;
      });
    } else {
      // API results still need date filtering
      if (dateThreshold) {
        source = source.filter((img) => {
          const created = new Date(img.createdAt || img.created_at);
          return created >= dateThreshold;
        });
      }
    }

    return source;
  }, [images, apiImages, query, typeFilter, dateFilter]);

  // Build flat result list for keyboard navigation (conversations + projects only, not images)
  const allResults = useMemo(() => {
    const items = [];
    filteredConversations.forEach((conv) => {
      items.push({ type: 'conversation', data: conv });
    });
    filteredProjects.forEach((proj) => {
      items.push({ type: 'project', data: proj });
    });
    return items;
  }, [filteredConversations, filteredProjects]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(allResults.length > 0 ? 0 : -1);
  }, [allResults.length]);

  // Navigate to result
  const navigateToResult = useCallback(
    (item) => {
      if (!item) return;
      if (item.type === 'conversation') {
        dispatch(setCurrentChat(item.data.id));
        dispatch(setMessages([]));
        dispatch(setActiveItem('home'));
      } else if (item.type === 'project') {
        dispatch(setActiveItem('projects'));
      } else if (item.type === 'image') {
        dispatch(setActiveItem('gallery'));
      }
      onClose();
    },
    [dispatch, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= allResults.length ? 0 : next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? allResults.length - 1 : next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < allResults.length) {
            navigateToResult(allResults[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, allResults, navigateToResult, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const activeEl = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const hasQuery = query.trim().length > 0;
  const hasAnyResults =
    filteredConversations.length > 0 || filteredProjects.length > 0 || filteredImages.length > 0;
  const noResults = hasQuery && !hasAnyResults && !apiLoading;

  // Track index offset for conversations vs projects
  let currentIndex = 0;

  // Determine what sections to show
  const showImages =
    filteredImages.length > 0 && typeFilter !== 'conversations' && typeFilter !== 'projects';
  const showConversations = filteredConversations.length > 0;
  const showProjects = filteredProjects.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <SearchIcon />
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything..."
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        {/* Navigation hints + filter bar */}
        <div className={styles.toolbar}>
          <div className={styles.navHints}>
            <span className={styles.navHint}>
              Navigate <kbd>&uarr;</kbd> <kbd>&darr;</kbd>
            </span>
            <span className={styles.navHint}>
              Open <kbd>&crarr;</kbd>
            </span>
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.dateFilterWrap}>
              <CalendarIcon />
              <select
                className={styles.dateSelect}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                {DATE_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <kbd className={styles.escKbd}>ESC</kbd>
          </div>
        </div>

        {/* Filter chips */}
        <div className={styles.filterBar}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`${styles.chip} ${typeFilter === f.key ? styles.chipActive : ''}`}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.key === 'conversations' && <ChatIcon />}
              {f.key === 'projects' && <ProjectsIcon />}
              {f.key === 'images' && <PhotoIcon />}
              {f.label}
              {f.key === 'conversations' && hasQuery && (
                <span className={styles.chipCount}>{filteredConversations.length}</span>
              )}
              {f.key === 'projects' && hasQuery && (
                <span className={styles.chipCount}>{filteredProjects.length}</span>
              )}
              {f.key === 'images' && hasQuery && (
                <span className={styles.chipCount}>{filteredImages.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Results area — fixed height, scrollable */}
        <div className={styles.results} ref={resultsRef}>
          {/* No results — only when user has typed something */}
          {noResults && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <SearchIcon />
              </div>
              <span className={styles.emptyTitle}>No results found</span>
              <span className={styles.emptyHint}>Nothing matched &ldquo;{query.trim()}&rdquo;</span>
            </div>
          )}

          {/* Loading */}
          {apiLoading && hasQuery && !hasAnyResults && (
            <div className={styles.loadingDot}>
              <span />
              <span />
              <span />
            </div>
          )}

          {/* Images carousel section */}
          {showImages && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Images</span>
                <span className={styles.sectionCount}>{filteredImages.length}</span>
              </div>
              <div className={styles.imageCarousel}>
                {filteredImages.map((img) => (
                  <button
                    key={img.id}
                    className={styles.imageCard}
                    onClick={() => navigateToResult({ type: 'image', data: img })}
                    title={img.prompt}
                  >
                    <div className={styles.imageThumb}>
                      <img src={img.url} alt={img.prompt || 'Generated image'} loading="lazy" />
                    </div>
                    <div className={styles.imageInfo}>
                      <span className={styles.imagePrompt}>{img.prompt || 'Generated image'}</span>
                      <span className={styles.imageMeta}>
                        {formatRelativeDate(img.createdAt || img.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation results */}
          {showConversations && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Conversations</span>
                <span className={styles.sectionCount}>{filteredConversations.length}</span>
              </div>
              {filteredConversations.map((conv) => {
                const idx = currentIndex++;
                const projectName = conv.projectId ? projectMap[conv.projectId] : null;
                return (
                  <button
                    key={conv.id}
                    data-index={idx}
                    className={`${styles.resultItem} ${
                      idx === activeIndex ? styles.resultItemActive : ''
                    }`}
                    onClick={() => navigateToResult({ type: 'conversation', data: conv })}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className={styles.resultIcon}>
                      <ChatIcon />
                    </div>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{conv.title || 'Untitled'}</span>
                      <span className={styles.resultMeta}>
                        {projectName && <span className={styles.projectBadge}>{projectName}</span>}
                        <span>{formatRelativeDate(conv.updatedAt || conv.updated_at)}</span>
                      </span>
                    </div>
                    {conv.isStarred && (
                      <span className={styles.starIndicator}>
                        <StarIcon filled />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Project results */}
          {showProjects && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>Projects</span>
                <span className={styles.sectionCount}>{filteredProjects.length}</span>
              </div>
              {filteredProjects.map((proj) => {
                const idx = currentIndex++;
                return (
                  <button
                    key={proj.id}
                    data-index={idx}
                    className={`${styles.resultItem} ${
                      idx === activeIndex ? styles.resultItemActive : ''
                    }`}
                    onClick={() => navigateToResult({ type: 'project', data: proj })}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className={styles.resultIcon}>
                      <ProjectsIcon />
                    </div>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{proj.name || 'Untitled'}</span>
                      <span className={styles.resultMeta}>
                        {proj.description && (
                          <span className={styles.resultDesc}>{proj.description}</span>
                        )}
                        <span>{formatRelativeDate(proj.updated_at)}</span>
                      </span>
                    </div>
                    {proj.is_starred && (
                      <span className={styles.starIndicator}>
                        <StarIcon filled />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
