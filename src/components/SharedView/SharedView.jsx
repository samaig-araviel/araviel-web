import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useSharedChats from '../../hooks/useSharedChats';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { GuestGate } from '../GuestGate';
import { useToast } from '../Toast/Toast';
import {
  ShareIcon,
  SearchIcon,
  CloseIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  LinkIcon,
  ExternalLinkIcon,
  TrashIcon,
  EyeIcon,
} from '../Icons';
import styles from './SharedView.module.css';

const SORT_OPTIONS = [
  { id: 'recent', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'views', label: 'Most viewed' },
];

const sortShares = (shares, sortId) => {
  const copy = [...shares];
  if (sortId === 'oldest') {
    copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortId === 'views') {
    copy.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else {
    copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return copy;
};

const groupSharesByDate = (shares) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7Days = new Date(startOfToday);
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date(startOfToday);
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const buckets = {
    Today: [],
    Yesterday: [],
    'Previous 7 days': [],
    'Previous 30 days': [],
    Older: [],
  };
  for (const share of shares) {
    const d = new Date(share.createdAt);
    if (d >= startOfToday) buckets.Today.push(share);
    else if (d >= startOfYesterday) buckets.Yesterday.push(share);
    else if (d >= startOf7Days) buckets['Previous 7 days'].push(share);
    else if (d >= startOf30Days) buckets['Previous 30 days'].push(share);
    else buckets.Older.push(share);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
};

const formatViewCount = (count) => {
  const n = typeof count === 'number' ? count : 0;
  if (n < 1000) return `${n} view${n === 1 ? '' : 's'}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k views`;
  return `${(n / 1_000_000).toFixed(1)}M views`;
};

const formatShareDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const buildPublicUrl = (token) => `${window.location.origin}/share/${token}`;

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const current = SORT_OPTIONS.find((o) => o.id === value) || SORT_OPTIONS[0];

  return (
    <div className={styles.sortWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.sortBtn}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.sortLabel}>Sort: {current.label}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <ul className={styles.sortMenu} role="listbox">
          {SORT_OPTIONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={`${styles.sortMenuItem} ${
                  option.id === value ? styles.sortMenuItemActive : ''
                }`}
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShareRowMenu({ shareUrl, onOpen, onCopy, onUnshare, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [position, setPosition] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(
        spaceBelow < 160 ? { bottom: '100%', marginBottom: 6 } : { top: '100%', marginTop: 6 }
      );
    }
    setOpen((v) => !v);
  };

  return (
    <div className={styles.rowMenuWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.rowMenuBtn}
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share actions"
        disabled={disabled}
      >
        <MoreVerticalIcon />
      </button>
      {open && (
        <div className={styles.rowMenu} style={position} role="menu">
          <a
            className={styles.rowMenuItem}
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onOpen?.();
            }}
          >
            <ExternalLinkIcon />
            <span>Open public link</span>
          </a>
          <button
            type="button"
            className={styles.rowMenuItem}
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onCopy();
            }}
          >
            <LinkIcon />
            <span>Copy link</span>
          </button>
          <div className={styles.rowMenuDivider} />
          <button
            type="button"
            className={`${styles.rowMenuItem} ${styles.rowMenuItemDanger}`}
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onUnshare();
            }}
          >
            <TrashIcon />
            <span>Unshare</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function SharedView() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { showError, showSuccess } = useToast();
  const { shares, loading, error, refetch, unshare, unshareMany } = useSharedChats({
    enabled: isAuthenticated,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortId, setSortId] = useState('recent');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [unshareTarget, setUnshareTarget] = useState(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [busyConversationId, setBusyConversationId] = useState(null);

  const sharesList = useMemo(() => shares || [], [shares]);

  const filteredShares = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = q
      ? sharesList.filter((s) => (s.title || 'Untitled conversation').toLowerCase().includes(q))
      : sharesList;
    return sortShares(base, sortId);
  }, [sharesList, searchQuery, sortId]);

  const groupedShares = useMemo(
    () => (sortId === 'recent' || sortId === 'oldest' ? groupSharesByDate(filteredShares) : null),
    [filteredShares, sortId]
  );

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedTokens(new Set());
  }, []);

  const toggleSelect = useCallback((token) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTokens(new Set(filteredShares.map((s) => s.shareToken)));
  }, [filteredShares]);

  const handleCopy = useCallback(
    async (token) => {
      try {
        await navigator.clipboard.writeText(buildPublicUrl(token));
        showSuccess('Link copied to clipboard');
      } catch {
        showError('Could not copy link');
      }
    },
    [showError, showSuccess]
  );

  const handleUnshareConfirmed = useCallback(async () => {
    if (!unshareTarget) return;
    setBusyConversationId(unshareTarget.conversationId);
    const result = await unshare(unshareTarget.conversationId);
    setBusyConversationId(null);
    setUnshareTarget(null);
    if (result.ok) {
      showSuccess('Conversation unshared');
    } else {
      showError(result.error || 'Could not unshare conversation');
    }
  }, [unshare, unshareTarget, showError, showSuccess]);

  const handleBulkUnshareConfirmed = useCallback(async () => {
    const tokenSet = new Set(selectedTokens);
    const ids = sharesList.filter((s) => tokenSet.has(s.shareToken)).map((s) => s.conversationId);
    if (ids.length === 0) {
      setBulkConfirm(false);
      return;
    }
    setBulkBusy(true);
    const result = await unshareMany(ids);
    setBulkBusy(false);
    setBulkConfirm(false);
    if (result.ok) {
      showSuccess(`${ids.length} conversation${ids.length === 1 ? '' : 's'} unshared`);
      exitSelectMode();
    } else {
      const restored = result.failures.length;
      showError(
        restored === ids.length
          ? "Couldn't unshare the selected conversations."
          : `Couldn't unshare ${restored} of ${ids.length}.`
      );
      setSelectedTokens(new Set());
    }
  }, [selectedTokens, sharesList, unshareMany, showError, showSuccess, exitSelectMode]);

  const handleOpenConversation = useCallback(
    (conversationId) => {
      if (selectMode) return;
      navigate(`/conversations/${conversationId}`);
    },
    [navigate, selectMode]
  );

  const totalCount = sharesList.length;
  const filteredCount = filteredShares.length;
  const hasSelection = selectedTokens.size > 0;

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Shared chats</h1>
          </div>
          <GuestGate
            icon={<ShareIcon />}
            title="Your shared links live here"
            description="Sign in to manage conversations you've shared publicly — view, copy, or unshare in one place."
            actionLabel="Sign in to manage shared chats"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Shared chats</h1>
            {shares !== null && (
              <span className={styles.subtitle}>
                {totalCount === 0
                  ? 'No conversations shared publicly.'
                  : `${totalCount} conversation${totalCount === 1 ? '' : 's'} shared publicly.`}
              </span>
            )}
          </div>
        </div>

        {shares !== null && totalCount > 0 && (
          <div className={styles.searchWrapper}>
            <div className={styles.searchIcon}>
              <SearchIcon />
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search shared chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}

        {shares !== null && totalCount > 0 && (
          <div className={styles.toolbar}>
            <SortMenu value={sortId} onChange={setSortId} />
            <button
              type="button"
              className={`${styles.selectToggle} ${selectMode ? styles.selectToggleActive : ''}`}
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        )}

        {selectMode && (
          <div className={styles.selectionBar}>
            <div className={styles.selectionLeft}>
              <span className={styles.selectionCount}>{selectedTokens.size} selected</span>
              {selectedTokens.size < filteredCount && (
                <button type="button" className={styles.selectAllBtn} onClick={selectAll}>
                  Select all
                </button>
              )}
            </div>
            <button
              type="button"
              className={`${styles.selectionAction} ${styles.selectionActionDanger}`}
              onClick={() => hasSelection && setBulkConfirm(true)}
              disabled={!hasSelection || bulkBusy}
            >
              <TrashIcon />
              <span>Unshare</span>
            </button>
            <button
              type="button"
              className={styles.selectionClose}
              onClick={exitSelectMode}
              aria-label="Exit selection"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className={styles.list}>
          {shares === null && loading ? (
            <SharedListSkeleton />
          ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorMessage}>{error}</p>
              <button type="button" className={styles.errorRetryBtn} onClick={refetch}>
                Try again
              </button>
            </div>
          ) : totalCount === 0 ? (
            <SharedEmptyState onBrowse={() => navigate('/conversations')} />
          ) : filteredCount === 0 ? (
            <NoResultsState query={searchQuery} onClear={() => setSearchQuery('')} />
          ) : groupedShares ? (
            groupedShares.map((group) => (
              <div key={group.label} className={styles.timeGroup}>
                <div className={styles.timeGroupLabel}>{group.label}</div>
                {group.items.map((share) => (
                  <SharedRow
                    key={share.shareToken}
                    share={share}
                    selectMode={selectMode}
                    isSelected={selectedTokens.has(share.shareToken)}
                    busy={busyConversationId === share.conversationId}
                    onToggleSelect={() => toggleSelect(share.shareToken)}
                    onOpen={() => handleOpenConversation(share.conversationId)}
                    onCopy={() => handleCopy(share.shareToken)}
                    onUnshare={() => setUnshareTarget(share)}
                  />
                ))}
              </div>
            ))
          ) : (
            <div className={styles.timeGroup}>
              {filteredShares.map((share) => (
                <SharedRow
                  key={share.shareToken}
                  share={share}
                  selectMode={selectMode}
                  isSelected={selectedTokens.has(share.shareToken)}
                  busy={busyConversationId === share.conversationId}
                  onToggleSelect={() => toggleSelect(share.shareToken)}
                  onOpen={() => handleOpenConversation(share.conversationId)}
                  onCopy={() => handleCopy(share.shareToken)}
                  onUnshare={() => setUnshareTarget(share)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {unshareTarget && (
        <ConfirmDialog
          title="Unshare this conversation?"
          description="The public link will stop working immediately. The conversation itself stays in your history."
          confirmLabel={busyConversationId ? 'Unsharing…' : 'Unshare'}
          busy={!!busyConversationId}
          onCancel={() => (busyConversationId ? null : setUnshareTarget(null))}
          onConfirm={handleUnshareConfirmed}
        />
      )}

      {bulkConfirm && (
        <ConfirmDialog
          title={`Unshare ${selectedTokens.size} conversation${
            selectedTokens.size === 1 ? '' : 's'
          }?`}
          description="Every selected public link will stop working immediately. The conversations themselves stay in your history."
          confirmLabel={bulkBusy ? 'Unsharing…' : 'Unshare all'}
          busy={bulkBusy}
          onCancel={() => (bulkBusy ? null : setBulkConfirm(false))}
          onConfirm={handleBulkUnshareConfirmed}
        />
      )}
    </div>
  );
}

function SharedRow({
  share,
  selectMode,
  isSelected,
  busy,
  onToggleSelect,
  onOpen,
  onCopy,
  onUnshare,
}) {
  const shareUrl = buildPublicUrl(share.shareToken);
  const title = share.title || 'Untitled conversation';
  const handleClick = () => {
    if (selectMode) onToggleSelect();
    else onOpen();
  };

  return (
    <div
      className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${
        selectMode ? styles.rowSelectMode : ''
      } ${busy ? styles.rowBusy : ''}`}
      onClick={handleClick}
      role={selectMode ? 'checkbox' : 'button'}
      aria-checked={selectMode ? isSelected : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {selectMode && (
        <div className={styles.checkboxArea}>
          <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
            {isSelected && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </div>
      )}
      <div className={styles.rowMeta}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowSub}>
          <span>Shared {formatShareDate(share.createdAt)}</span>
          <span className={styles.rowDot}>•</span>
          <span className={styles.rowViews}>
            <EyeIcon />
            {formatViewCount(share.viewCount)}
          </span>
        </span>
      </div>
      {!selectMode && (
        <ShareRowMenu
          shareUrl={shareUrl}
          disabled={busy}
          onOpen={onOpen}
          onCopy={onCopy}
          onUnshare={onUnshare}
        />
      )}
    </div>
  );
}

function SharedListSkeleton() {
  return (
    <div className={styles.skeleton}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonTitle} style={{ width: `${45 + ((i * 13) % 35)}%` }} />
          <div className={styles.skeletonSub} style={{ width: `${25 + ((i * 7) % 18)}%` }} />
        </div>
      ))}
    </div>
  );
}

function SharedEmptyState({ onBrowse }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <ShareIcon />
      </div>
      <h3 className={styles.emptyTitle}>No shared chats yet</h3>
      <p className={styles.emptyDesc}>
        When you share a conversation publicly, it&rsquo;ll appear here so you can manage every
        active link in one place.
      </p>
      <button type="button" className={styles.emptyAction} onClick={onBrowse}>
        Browse your conversations
      </button>
    </div>
  );
}

function NoResultsState({ query, onClear }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <SearchIcon />
      </div>
      <h3 className={styles.emptyTitle}>No matches for &ldquo;{query}&rdquo;</h3>
      <p className={styles.emptyDesc}>Try a different search term.</p>
      <button type="button" className={styles.emptyAction} onClick={onClear}>
        Clear search
      </button>
    </div>
  );
}

function ConfirmDialog({ title, description, confirmLabel, busy, onCancel, onConfirm }) {
  return (
    <div className={styles.confirmOverlay} onClick={onCancel} role="presentation">
      <div
        className={styles.confirmDialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-confirm-title"
      >
        <div className={styles.confirmIcon}>
          <TrashIcon />
        </div>
        <h3 id="shared-confirm-title" className={styles.confirmTitle}>
          {title}
        </h3>
        <p className={styles.confirmDesc}>{description}</p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.confirmCancelBtn}
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmConfirmBtn}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
