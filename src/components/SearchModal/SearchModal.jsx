import { useRef } from 'react';
import {
  SearchIcon,
  ChatIcon,
  ProjectsIcon,
  StarIcon,
  CalendarIcon,
  CloseIcon,
  PhotoIcon,
} from '../Icons';
import { useSearch, TYPE_FILTERS, DATE_FILTERS, formatRelativeDate } from './useSearch';
import styles from './SearchModal.module.css';

export default function SearchModal({ onClose }) {
  const inputRef = useRef(null);
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
    displayedConversations,
    displayedProjects,
    displayedImages,
    totalConversations,
    totalProjects,
    totalImages,
    apiLoading,
    hasQuery,
    hasAnyResults,
    noResults,
    showImages,
    showConversations,
    showProjects,
    navigateToResult,
    resultsRef,
  } = useSearch({ onAfterNavigate: onClose, enableEscape: true });

  // Index offset for combining sections in keyboard navigation
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
                <span className={styles.chipCount}>{totalConversations}</span>
              )}
              {f.key === 'projects' && hasQuery && (
                <span className={styles.chipCount}>{totalProjects}</span>
              )}
              {f.key === 'images' && hasQuery && (
                <span className={styles.chipCount}>{totalImages}</span>
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
                <span className={styles.sectionCount}>{totalImages}</span>
              </div>
              <div className={styles.imageCarousel}>
                {displayedImages.map((img) => (
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
                <span className={styles.sectionCount}>{totalConversations}</span>
              </div>
              {displayedConversations.map((conv) => {
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
                <span className={styles.sectionCount}>{totalProjects}</span>
              </div>
              {displayedProjects.map((proj) => {
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
