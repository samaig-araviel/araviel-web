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
import { searchConversations, searchProjects } from '../../services/api';
import { SearchIcon, ChatIcon, ProjectsIcon, StarIcon, CalendarIcon } from '../Icons';
import styles from './SearchModal.module.css';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'projects', label: 'Projects' },
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  // Determine if we need API search (more conversations on server than loaded)
  const needsApiSearch = conversations.length < conversationsTotal;

  // Debounced API search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setApiConversations(null);
      setApiProjects(null);
      setApiLoading(false);
      return;
    }

    if (!needsApiSearch) {
      setApiConversations(null);
      setApiProjects(null);
      return;
    }

    setApiLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const [convResult, projResult] = await Promise.all([
          searchConversations(query.trim()),
          searchProjects(query.trim()),
        ]);
        setApiConversations(convResult.conversations || []);
        setApiProjects(projResult.projects || []);
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

  // Filter conversations (client-side first, merge with API if available)
  const filteredConversations = useMemo(() => {
    if (typeFilter === 'projects') return [];

    const q = query.toLowerCase().trim();
    const dateThreshold = getDateThreshold(dateFilter);

    // Start with client-side data
    let source = conversations || [];

    // Merge API results if available (deduplicate)
    if (apiConversations) {
      const existingIds = new Set(source.map((c) => c.id));
      const newFromApi = apiConversations.filter((c) => !existingIds.has(c.id));
      source = [...source, ...newFromApi];
    }

    return source.filter((conv) => {
      // Text match
      if (q && !conv.title?.toLowerCase().includes(q)) return false;
      // Date filter
      if (dateThreshold) {
        const updated = new Date(conv.updatedAt || conv.updated_at);
        if (updated < dateThreshold) return false;
      }
      return true;
    });
  }, [conversations, apiConversations, query, typeFilter, dateFilter]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (typeFilter === 'conversations') return [];

    const q = query.toLowerCase().trim();
    const dateThreshold = getDateThreshold(dateFilter);

    let source = projects || [];

    // Merge API results if available
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

  // Build flat result list for keyboard navigation
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
  const noResults = hasQuery && allResults.length === 0 && !apiLoading;

  // Track index offset for conversations vs projects
  let currentIndex = 0;

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
            placeholder="Search conversations and projects..."
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.typeFilters}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`${styles.chip} ${typeFilter === f.key ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
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
        </div>

        <div className={styles.divider} />

        {/* Results */}
        <div className={styles.results} ref={resultsRef}>
          {/* Empty state — no query */}
          {!hasQuery && !apiLoading && (
            <div className={styles.emptyState}>
              <SearchIcon />
              <span className={styles.emptyTitle}>Search your workspace</span>
              <span className={styles.emptyHint}>Find conversations and projects by name</span>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className={styles.emptyState}>
              <SearchIcon />
              <span className={styles.emptyTitle}>No results found</span>
              <span className={styles.emptyHint}>No matches for &ldquo;{query.trim()}&rdquo;</span>
            </div>
          )}

          {/* Loading indicator */}
          {apiLoading && hasQuery && allResults.length === 0 && (
            <div className={styles.loadingDot}>
              <span />
              <span />
              <span />
            </div>
          )}

          {/* Conversation results */}
          {filteredConversations.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Conversations</div>
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
                    <ChatIcon />
                    <div className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{conv.title || 'Untitled'}</span>
                      <span className={styles.resultMeta}>
                        {projectName && <span className={styles.projectBadge}>{projectName}</span>}
                        {formatRelativeDate(conv.updatedAt || conv.updated_at)}
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
          {filteredProjects.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Projects</div>
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
                    <ProjectsIcon />
                    <div className={styles.resultInfo}>
                      <span className={styles.resultTitle}>{proj.name || 'Untitled'}</span>
                      <span className={styles.resultMeta}>
                        {formatRelativeDate(proj.updated_at)}
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

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <kbd>&uarr;&darr;</kbd> Navigate
          </span>
          <span className={styles.footerHint}>
            <kbd>&crarr;</kbd> Open
          </span>
          <span className={styles.footerHint}>
            <kbd>ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
