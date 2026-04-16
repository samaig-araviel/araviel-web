import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, ChatIcon, ProjectsIcon, StarIcon, CalendarIcon, PhotoIcon } from '../Icons';
import {
  useSearch,
  TYPE_FILTERS,
  DATE_FILTERS,
  formatRelativeDate,
} from '../SearchModal/useSearch';
import styles from './SearchView.module.css';

const VALID_TYPES = new Set(TYPE_FILTERS.map((f) => f.key));
const VALID_DATES = new Set(DATE_FILTERS.map((f) => f.key));

function readInitialState(params) {
  const rawType = params.get('type');
  const rawDate = params.get('date');
  return {
    query: params.get('q') || '',
    typeFilter: rawType && VALID_TYPES.has(rawType) ? rawType : 'all',
    dateFilter: rawDate && VALID_DATES.has(rawDate) ? rawDate : 'all',
  };
}

export default function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);

  // Read URL params once on first render; URL is the source of truth for
  // initial values but we then own the state locally to avoid re-render loops.
  const [initialState] = useState(() => readInitialState(searchParams));

  const {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    activeIndex,
    setActiveIndex,
    projectMap,
    filteredConversations,
    filteredProjects,
    filteredImages,
    apiLoading,
    hasQuery,
    hasAnyResults,
    noResults,
    showImages,
    showConversations,
    showProjects,
    navigateToResult,
    resultsRef,
  } = useSearch({ initialState, enableEscape: false });

  // Autofocus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync state → URL. `replace: true` so Back goes to the previous page
  // rather than walking through every keystroke. Omit default values to
  // keep the URL clean.
  const syncingFromParams = useRef(false);
  useEffect(() => {
    if (syncingFromParams.current) {
      syncingFromParams.current = false;
      return;
    }
    const next = new URLSearchParams();
    const q = query.trim();
    if (q) next.set('q', q);
    if (typeFilter !== 'all') next.set('type', typeFilter);
    if (dateFilter !== 'all') next.set('date', dateFilter);
    // Only write if different to avoid triggering a no-op navigation.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [query, typeFilter, dateFilter, searchParams, setSearchParams]);

  // Sync URL → state (Back/Forward navigation)
  useEffect(() => {
    const next = readInitialState(searchParams);
    if (next.query !== query || next.typeFilter !== typeFilter || next.dateFilter !== dateFilter) {
      syncingFromParams.current = true;
      setQuery(next.query);
      setTypeFilter(next.typeFilter);
      setDateFilter(next.dateFilter);
    }
    // We only want this to run when the URL changes externally, not when
    // local state drives a URL write. The guard ref handles that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  let currentIndex = 0;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.title}>Search</h1>
        </div>

        {/* Search input */}
        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, projects, and images…"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Toolbar: keyboard hints + date filter */}
        <div className={styles.toolbar}>
          <div className={styles.navHints}>
            <span className={styles.navHint}>
              Navigate <kbd>&uarr;</kbd> <kbd>&darr;</kbd>
            </span>
            <span className={styles.navHint}>
              Open <kbd>&crarr;</kbd>
            </span>
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

        {/* Results */}
        <div className={styles.results} ref={resultsRef}>
          {!hasQuery && !hasAnyResults && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <SearchIcon />
              </div>
              <span className={styles.emptyTitle}>Start typing to search</span>
              <span className={styles.emptyHint}>
                Search across conversations, projects, and generated images
              </span>
            </div>
          )}

          {noResults && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <SearchIcon />
              </div>
              <span className={styles.emptyTitle}>No results found</span>
              <span className={styles.emptyHint}>Nothing matched &ldquo;{query.trim()}&rdquo;</span>
            </div>
          )}

          {apiLoading && hasQuery && !hasAnyResults && (
            <div className={styles.loadingDot}>
              <span />
              <span />
              <span />
            </div>
          )}

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
