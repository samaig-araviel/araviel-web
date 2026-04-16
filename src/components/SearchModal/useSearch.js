import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectConversations,
  selectConversationsTotal,
  setCurrentChat,
  setMessages,
} from '../../store/slices/chatSlice';
import { selectProjects } from '../../store/slices/projectsSlice';
import { searchConversations, searchProjects, searchImages } from '../../services/api';
import { getGeneratedImages } from '../../services/imageGeneration';

export const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'projects', label: 'Projects' },
  { key: 'images', label: 'Images' },
];

export const DATE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7days', label: 'Last 7 days' },
  { key: '30days', label: 'Last 30 days' },
];

export function getDateThreshold(key) {
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

export function formatRelativeDate(dateStr) {
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

/**
 * Shared search controller for both SearchModal (popup) and SearchView (page).
 * Owns all state, debounced API calls, filtering, and keyboard navigation so
 * the two surfaces can never drift out of sync.
 *
 * @param {object} [options]
 * @param {() => void} [options.onAfterNavigate] - Called after a result is
 *   chosen (modal uses this to close itself; page leaves undefined).
 * @param {boolean} [options.enableEscape] - When true, Escape triggers
 *   onAfterNavigate (modal dismiss). Pages pass false.
 * @param {{query?: string, typeFilter?: string, dateFilter?: string}} [options.initialState]
 *   Seed values for the URL-synced page surface. Only read on first render.
 */
export function useSearch({ onAfterNavigate, enableEscape = false, initialState } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const projects = useSelector(selectProjects);

  const [query, setQuery] = useState(initialState?.query ?? '');
  const [typeFilter, setTypeFilter] = useState(initialState?.typeFilter ?? 'all');
  const [dateFilter, setDateFilter] = useState(initialState?.dateFilter ?? 'all');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiConversations, setApiConversations] = useState(null);
  const [apiProjects, setApiProjects] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [images, setImages] = useState(() => getGeneratedImages() || []);
  const [apiImages, setApiImages] = useState(null);

  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Keep local image cache in sync if it's populated later.
  useEffect(() => {
    if (images.length === 0) {
      const cached = getGeneratedImages();
      if (cached && cached.length > 0) setImages(cached);
    }
    // Only run once on mount — further updates come through apiImages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } else if (dateThreshold) {
      source = source.filter((img) => {
        const created = new Date(img.createdAt || img.created_at);
        return created >= dateThreshold;
      });
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
        navigate(`/conversations/${item.data.id}`);
      } else if (item.type === 'project') {
        navigate('/projects');
      } else if (item.type === 'image') {
        navigate('/images');
      }
      onAfterNavigate?.();
    },
    [dispatch, navigate, onAfterNavigate]
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
          if (enableEscape) {
            e.preventDefault();
            onAfterNavigate?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, allResults, navigateToResult, onAfterNavigate, enableEscape]);

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

  const showImages =
    filteredImages.length > 0 && typeFilter !== 'conversations' && typeFilter !== 'projects';
  const showConversations = filteredConversations.length > 0;
  const showProjects = filteredProjects.length > 0;

  return {
    // state
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    activeIndex,
    setActiveIndex,
    // derived data
    projectMap,
    filteredConversations,
    filteredProjects,
    filteredImages,
    // flags
    apiLoading,
    hasQuery,
    hasAnyResults,
    noResults,
    showImages,
    showConversations,
    showProjects,
    // navigation
    navigateToResult,
    // refs
    resultsRef,
  };
}
