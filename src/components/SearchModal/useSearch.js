import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectConversations } from '../../store/slices/chatSlice';
import { selectProjects } from '../../store/slices/projectsSlice';
import { searchConversations, searchProjects, searchImages } from '../../services/api';
import { getGeneratedImages } from '../../services/imageGeneration';

// Size of each paginated API request. Load More issues a follow-up fetch
// at this granularity when the user runs past the end of what's already
// been pulled down. Matches the backend's default page size.
const API_PAGE_SIZE = 20;

function dedupById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

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
 * Owns all state, debounced API calls, filtering, pagination, and keyboard
 * navigation so the two surfaces can never drift out of sync.
 *
 * @param {object} [options]
 * @param {() => void} [options.onAfterNavigate] - Called after a result is
 *   chosen (modal uses this to close itself; page leaves undefined).
 * @param {boolean} [options.enableEscape] - When true, Escape triggers
 *   onAfterNavigate (modal dismiss). Pages pass false.
 * @param {{query?: string, typeFilter?: string, dateFilter?: string}} [options.initialState]
 *   Seed values for the URL-synced page surface. Only read on first render.
 * @param {{conversationsPageSize?: number, projectsPageSize?: number, imagesPageSize?: number}} [options.pagination]
 *   When provided, each list is clipped to its page size and exposes a
 *   load-more callback. Defaults to no pagination (all results shown).
 * @param {boolean} [options.fetchBaselineImages] - When true, hydrates
 *   apiImages from the server even when the query is empty, so
 *   surfaces that expose an images tab have real content regardless
 *   of whether the gallery has been visited. The modal leaves this off
 *   to preserve its minimal idle state.
 */
export function useSearch({
  onAfterNavigate,
  enableEscape = false,
  initialState,
  pagination,
  fetchBaselineImages = false,
} = {}) {
  const conversationsPageSize = pagination?.conversationsPageSize ?? Infinity;
  const projectsPageSize = pagination?.projectsPageSize ?? Infinity;
  const imagesPageSize = pagination?.imagesPageSize ?? Infinity;

  const navigate = useNavigate();
  const conversations = useSelector(selectConversations);
  const projects = useSelector(selectProjects);

  const [query, setQuery] = useState(initialState?.query ?? '');
  const [typeFilter, setTypeFilter] = useState(initialState?.typeFilter ?? 'all');
  const [dateFilter, setDateFilter] = useState(initialState?.dateFilter ?? 'all');
  const [activeIndex, setActiveIndex] = useState(-1);

  // ── API search accumulators ───────────────────────────────────
  // Each type carries the results we've fetched across every API page
  // for the current query. Conversations expose a `total` so we know
  // exactly when to stop; images use a "next page was full" heuristic
  // because the endpoint doesn't return a count; projects aren't
  // paginated server-side so a single fetch covers them.
  const [apiConversations, setApiConversations] = useState([]);
  const [apiConversationsTotal, setApiConversationsTotal] = useState(0);
  const [apiConversationsLoadingMore, setApiConversationsLoadingMore] = useState(false);
  const [apiProjects, setApiProjects] = useState([]);
  const [apiImages, setApiImages] = useState([]);
  const [apiImagesHasMoreServer, setApiImagesHasMoreServer] = useState(false);
  const [apiImagesLoadingMore, setApiImagesLoadingMore] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  const [images, setImages] = useState(() => getGeneratedImages() || []);

  const resultsRef = useRef(null);
  const debounceRef = useRef(null);
  // Identifies the query that "owns" in-flight API requests so late
  // responses from a superseded query can be discarded. Set before
  // firing, checked before writing results.
  const activeQueryRef = useRef('');
  // Synchronous guards against double-fire of Load More — React's
  // StrictMode double-invokes effects/reducers in dev, and the state
  // flags don't update until after the current tick.
  const fetchingMoreConversationsRef = useRef(false);
  const fetchingMoreImagesRef = useRef(false);

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

  // ── Debounced initial API search ──────────────────────────────
  // Fetches the first page of each type in parallel. Behaviour forks
  // on query length:
  //  • ≥ 2 characters — full search across conversations, projects
  //    and images.
  //  • empty — no search term. When `fetchBaselineImages` is on we
  //    still hydrate the images list so surfaces like the dedicated
  //    /search page can show content on their Images tab without the
  //    user having opened the gallery. Conversations and projects
  //    already come from Redux on sign-in, so they never need this
  //    baseline fetch.
  //  • exactly 1 character — too noisy to hit the server; no-op so
  //    the UI doesn't flicker mid-typing.
  const queryKey = query.trim();
  useEffect(() => {
    if (queryKey.length === 1) return;

    const isSearch = queryKey.length >= 2;
    const shouldFetchImages = isSearch || fetchBaselineImages;

    if (!isSearch && !shouldFetchImages) {
      // Idle modal with empty query — clear everything and bail.
      activeQueryRef.current = '';
      setApiConversations([]);
      setApiConversationsTotal(0);
      setApiConversationsLoadingMore(false);
      setApiProjects([]);
      setApiImages([]);
      setApiImagesHasMoreServer(false);
      setApiImagesLoadingMore(false);
      setApiLoading(false);
      return;
    }

    setApiLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    // No debounce for the empty-query baseline — it only runs on mount
    // (and when the user clears their query), never mid-typing.
    const delay = isSearch ? 200 : 0;
    debounceRef.current = setTimeout(async () => {
      activeQueryRef.current = queryKey;
      try {
        const [convResult, projResult, imgResult] = await Promise.all([
          isSearch ? searchConversations(queryKey, API_PAGE_SIZE, 0) : Promise.resolve(null),
          isSearch ? searchProjects(queryKey) : Promise.resolve(null),
          shouldFetchImages ? searchImages(queryKey, API_PAGE_SIZE, 0) : Promise.resolve(null),
        ]);
        if (activeQueryRef.current !== queryKey) return;

        if (isSearch) {
          const convs = convResult?.conversations ?? [];
          setApiConversations(convs);
          setApiConversationsTotal(convResult?.total ?? convs.length);
          setApiProjects(projResult?.projects ?? []);
        } else {
          setApiConversations([]);
          setApiConversationsTotal(0);
          setApiProjects([]);
        }

        if (imgResult) {
          const imgs = imgResult.images ?? [];
          setApiImages(imgs);
          setApiImagesHasMoreServer(imgs.length === API_PAGE_SIZE);
        } else {
          setApiImages([]);
          setApiImagesHasMoreServer(false);
        }
      } catch {
        // Silent fail — local results still render. Leave accumulators
        // as-is so the UI stays stable.
      } finally {
        if (activeQueryRef.current === queryKey) setApiLoading(false);
      }
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryKey, fetchBaselineImages]);

  // ── Follow-up API page fetches (Load More) ────────────────────
  // Only fire if (a) the query is still current, (b) we aren't
  // already fetching, and (c) the server has more rows to give.
  const fetchMoreApiConversations = useCallback(async () => {
    if (fetchingMoreConversationsRef.current) return;
    if (apiConversations.length >= apiConversationsTotal) return;
    if (queryKey.length < 2) return;

    fetchingMoreConversationsRef.current = true;
    setApiConversationsLoadingMore(true);
    try {
      const result = await searchConversations(queryKey, API_PAGE_SIZE, apiConversations.length);
      if (activeQueryRef.current !== queryKey) return;
      const page = result?.conversations ?? [];
      setApiConversations((prev) => dedupById([...prev, ...page]));
      if (typeof result?.total === 'number') {
        setApiConversationsTotal(result.total);
      }
    } catch {
      // Silent fail — user can retry by clicking Load more again.
    } finally {
      fetchingMoreConversationsRef.current = false;
      setApiConversationsLoadingMore(false);
    }
  }, [apiConversations.length, apiConversationsTotal, queryKey]);

  const fetchMoreApiImages = useCallback(async () => {
    if (fetchingMoreImagesRef.current) return;
    if (!apiImagesHasMoreServer) return;
    if (queryKey.length < 2) return;

    fetchingMoreImagesRef.current = true;
    setApiImagesLoadingMore(true);
    try {
      const result = await searchImages(queryKey, API_PAGE_SIZE, apiImages.length);
      if (activeQueryRef.current !== queryKey) return;
      const page = result?.images ?? [];
      setApiImages((prev) => dedupById([...prev, ...page]));
      setApiImagesHasMoreServer(page.length === API_PAGE_SIZE);
    } catch {
      // Silent fail
    } finally {
      fetchingMoreImagesRef.current = false;
      setApiImagesLoadingMore(false);
    }
  }, [apiImages.length, apiImagesHasMoreServer, queryKey]);

  // ── Filtered (merged) lists ──────────────────────────────────
  // Union Redux-cached entries with whatever the API has returned so
  // fresh items found server-side appear even when they aren't in the
  // sidebar yet. Date filter is applied client-side.
  const filteredConversations = useMemo(() => {
    if (typeFilter === 'projects' || typeFilter === 'images') return [];

    const q = queryKey.toLowerCase();
    const dateThreshold = getDateThreshold(dateFilter);
    const source = dedupById([...(conversations || []), ...apiConversations]);

    return source.filter((conv) => {
      if (q && !conv.title?.toLowerCase().includes(q)) return false;
      if (dateThreshold) {
        const updated = new Date(conv.updatedAt || conv.updated_at);
        if (updated < dateThreshold) return false;
      }
      return true;
    });
  }, [conversations, apiConversations, queryKey, typeFilter, dateFilter]);

  const filteredProjects = useMemo(() => {
    if (typeFilter === 'conversations' || typeFilter === 'images') return [];

    const q = queryKey.toLowerCase();
    const dateThreshold = getDateThreshold(dateFilter);
    const source = dedupById([...(projects || []), ...apiProjects]);

    return source.filter((proj) => {
      if (q && !proj.name?.toLowerCase().includes(q)) return false;
      if (dateThreshold) {
        const updated = new Date(proj.updated_at);
        if (updated < dateThreshold) return false;
      }
      return true;
    });
  }, [projects, apiProjects, queryKey, typeFilter, dateFilter]);

  const filteredImages = useMemo(() => {
    if (typeFilter === 'conversations' || typeFilter === 'projects') return [];

    const q = queryKey.toLowerCase();
    const dateThreshold = getDateThreshold(dateFilter);
    // The API is the authoritative source (it covers every image the
    // user owns). The in-memory cache is merged in as a harmless
    // fallback for items the user has just generated this session and
    // that haven't been returned by a server page yet.
    const source = dedupById([...apiImages, ...(images || [])]);

    return source.filter((img) => {
      if (q && !img.prompt?.toLowerCase().includes(q)) return false;
      if (dateThreshold) {
        const created = new Date(img.createdAt || img.created_at);
        if (created < dateThreshold) return false;
      }
      return true;
    });
  }, [images, apiImages, queryKey, typeFilter, dateFilter]);

  // ── Pagination ────────────────────────────────────────────────
  // Each list has a "visible count" that grows via loadMore. Counts reset
  // whenever the user changes the query or a filter so the user always
  // starts from the first page after a new search.
  const [visibleConversations, setVisibleConversations] = useState(conversationsPageSize);
  const [visibleProjects, setVisibleProjects] = useState(projectsPageSize);
  const [visibleImages, setVisibleImages] = useState(imagesPageSize);

  useEffect(() => {
    setVisibleConversations(conversationsPageSize);
    setVisibleProjects(projectsPageSize);
    setVisibleImages(imagesPageSize);
  }, [query, typeFilter, dateFilter, conversationsPageSize, projectsPageSize, imagesPageSize]);

  const displayedConversations = useMemo(
    () => filteredConversations.slice(0, visibleConversations),
    [filteredConversations, visibleConversations]
  );
  const displayedProjects = useMemo(
    () => filteredProjects.slice(0, visibleProjects),
    [filteredProjects, visibleProjects]
  );
  const displayedImages = useMemo(
    () => filteredImages.slice(0, visibleImages),
    [filteredImages, visibleImages]
  );

  // "Has more" is true when either (a) we're still revealing slices of
  // already-fetched data, or (b) the server has further pages we
  // haven't pulled down yet. Projects have no server pagination, so
  // only the local condition applies.
  const hasMoreApiConversations = apiConversations.length < apiConversationsTotal;
  const hasMoreApiImages = apiImagesHasMoreServer;

  const hasMoreConversations =
    filteredConversations.length > displayedConversations.length || hasMoreApiConversations;
  const hasMoreProjects = filteredProjects.length > displayedProjects.length;
  const hasMoreImages = filteredImages.length > displayedImages.length || hasMoreApiImages;

  // Load More reveals the next slice locally and, when the reveal
  // would outrun what's been fetched, transparently pulls the next
  // API page. Functional state updates keep rapid clicks coherent;
  // fetchMore is idempotent via its ref guard, so the side effect is
  // safe even under StrictMode's double-invoke.
  const loadMoreConversations = useCallback(() => {
    setVisibleConversations((prev) => {
      const next = prev + conversationsPageSize;
      if (hasMoreApiConversations && next > filteredConversations.length - conversationsPageSize) {
        fetchMoreApiConversations();
      }
      return next;
    });
  }, [
    conversationsPageSize,
    hasMoreApiConversations,
    fetchMoreApiConversations,
    filteredConversations.length,
  ]);

  const loadMoreProjects = useCallback(() => {
    setVisibleProjects((prev) => prev + projectsPageSize);
  }, [projectsPageSize]);

  const loadMoreImages = useCallback(() => {
    setVisibleImages((prev) => {
      const next = prev + imagesPageSize;
      if (hasMoreApiImages && next > filteredImages.length - imagesPageSize) {
        fetchMoreApiImages();
      }
      return next;
    });
  }, [imagesPageSize, hasMoreApiImages, fetchMoreApiImages, filteredImages.length]);

  // Build flat result list for keyboard navigation — only covers visible
  // items so keyboard nav never targets something the user cannot see.
  // Images are intentionally excluded from keyboard navigation.
  const allResults = useMemo(() => {
    const items = [];
    displayedConversations.forEach((conv) => {
      items.push({ type: 'conversation', data: conv });
    });
    displayedProjects.forEach((proj) => {
      items.push({ type: 'project', data: proj });
    });
    return items;
  }, [displayedConversations, displayedProjects]);

  // Reset active index only when the filter set changes. Load More (which
  // extends the list) must preserve the user's current selection.
  const filterKey = `${query}|${typeFilter}|${dateFilter}`;
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    const isFilterChange = prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    if (isFilterChange) {
      setActiveIndex(allResults.length > 0 ? 0 : -1);
      return;
    }

    // Filter unchanged — clamp / seed without jumping the user.
    setActiveIndex((prev) => {
      if (allResults.length === 0) return -1;
      if (prev === -1) return 0;
      if (prev >= allResults.length) return allResults.length - 1;
      return prev;
    });
  }, [filterKey, allResults.length]);

  // Navigate to result. Each target has its own URL shape — the route
  // components themselves are responsible for loading state (e.g.
  // ConversationRoute fetches messages when the :id param changes), so
  // we must not pre-set currentChat here: doing that would make the
  // route see "id === currentChatId" and skip loading.
  const navigateToResult = useCallback(
    (item) => {
      if (!item) return;
      if (item.type === 'conversation') {
        navigate(`/conversations/${item.data.id}`);
      } else if (item.type === 'project') {
        navigate(`/projects/${item.data.id}`);
      } else if (item.type === 'image') {
        navigate(`/images/${item.data.id}`);
      }
      onAfterNavigate?.();
    },
    [navigate, onAfterNavigate]
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
    displayedImages.length > 0 && typeFilter !== 'conversations' && typeFilter !== 'projects';
  const showConversations = displayedConversations.length > 0;
  const showProjects = displayedProjects.length > 0;

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
    // derived data — what to render
    projectMap,
    displayedConversations,
    displayedProjects,
    displayedImages,
    // totals — for chip counts, section counts, and "view all" labels
    totalConversations: filteredConversations.length,
    totalProjects: filteredProjects.length,
    totalImages: filteredImages.length,
    // pagination
    hasMoreConversations,
    hasMoreProjects,
    hasMoreImages,
    loadMoreConversations,
    loadMoreProjects,
    loadMoreImages,
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
