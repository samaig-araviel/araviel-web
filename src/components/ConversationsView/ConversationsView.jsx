import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectConversations,
  selectConversationsTotal,
  selectConversationsLoading,
  selectCurrentChatId,
  selectMessages,
  setConversations,
  appendConversations,
  setConversationsLoading,
  setCurrentChat,
  setMessages,
  setImportedContext,
  createNewChat,
} from '../../store/slices/chatSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { GuestGate } from '../GuestGate';
import {
  fetchConversations,
  fetchImportedConversations,
  fetchImportedConversationMessages,
  importConversations as importConversationsApi,
  updateImportedConversation,
  bulkUpdateImportedConversations,
  deleteImportedConversation,
  bulkDeleteImportedConversations,
  updateConversation,
  fetchProjects as fetchProjectsApi,
  fetchTrashedConversations,
  restoreConversation,
  purgeConversation,
} from '../../services/api';
import { useToast } from '../Toast/Toast';
import useDeleteConversation from '../../hooks/useDeleteConversation';
import { selectProjects, setProjects } from '../../store/slices/projectsSlice';
import {
  SearchIcon,
  StarIcon,
  ArchiveIcon,
  TrashIcon,
  CloseIcon,
  ChatIcon,
  PlusIcon,
  MoreVerticalIcon,
  ShareIcon,
  EditIcon,
  LinkIcon,
  ImportIcon,
  ProjectsIcon,
  RefreshIcon,
} from '../Icons';
import { getProviderLogo } from '../getProviderLogo';
import ImportConversationsModal from '../ImportConversationsModal';
import ProjectPickerModal from '../ProjectPickerModal';
import ShareModal from '../ShareModal/ShareModal';
import styles from './ConversationsView.module.css';

const CONVERSATIONS_PAGE_SIZE = 15;

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
  { id: 'trash', label: 'Recently deleted' },
];

function groupConversationsByTime(conversations) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7Days = new Date(startOfToday);
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date(startOfToday);
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const groups = [];
  const buckets = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  for (const chat of conversations) {
    const d = new Date(chat.updatedAt || chat.createdAt);
    if (d >= startOfToday) buckets.Today.push(chat);
    else if (d >= startOfYesterday) buckets.Yesterday.push(chat);
    else if (d >= startOf7Days) buckets['Previous 7 Days'].push(chat);
    else if (d >= startOf30Days) buckets['Previous 30 Days'].push(chat);
    else buckets.Older.push(chat);
  }

  for (const [label, items] of Object.entries(buckets)) {
    if (items.length > 0) groups.push({ label, items });
  }
  return groups;
}

function useItemMenu(
  conversations,
  conversationsTotal,
  dispatch,
  { onArchive, deleteConversation } = {}
) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({});
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareModalChatId, setShareModalChatId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const renameInputRef = useRef(null);

  const computePosition = useCallback((btnEl) => {
    if (!btnEl) return;
    const rect = btnEl.getBoundingClientRect();
    const menuHeight = 170;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const pos = {};
    if (spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow) {
      pos.bottom = '100%';
      pos.top = 'auto';
      pos.marginBottom = '4px';
    } else {
      pos.top = '100%';
      pos.bottom = 'auto';
      pos.marginTop = '4px';
    }

    pos.right = '0';
    pos.left = 'auto';
    setMenuPosition(pos);
  }, []);

  const handleMenuToggle = useCallback(
    (e, chatId) => {
      e.stopPropagation();
      if (menuOpenId === chatId) {
        setMenuOpenId(null);
      } else {
        setMenuOpenId(chatId);
        computePosition(e.currentTarget);
      }
    },
    [menuOpenId, computePosition]
  );

  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target)
      ) {
        setMenuOpenId(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpenId]);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const closeMenu = () => {
    setMenuOpenId(null);
  };

  const handleRename = (chat) => {
    closeMenu();
    setRenamingId(chat.id);
    setRenameValue(chat.title || '');
  };

  const handleRenameSubmit = (chatId) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      dispatch(
        setConversations({
          conversations: conversations.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)),
          total: conversationsTotal,
        })
      );
      // Persist to backend
      updateConversation(chatId, { title: trimmed }).catch(() => {
        if (showError) showError("Couldn't rename this conversation. Try again.");
      });
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(chatId);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleShareLink = (chatId) => {
    closeMenu();
    setShareModalChatId(chatId);
  };

  const handleArchive = (chatId) => {
    closeMenu();
    if (onArchive) {
      onArchive(chatId);
    }
  };

  const handleDeleteRequest = (chatId) => {
    closeMenu();
    setDeleteConfirm(chatId);
  };

  const confirmDelete = () => {
    const chatId = deleteConfirm;
    setDeleteConfirm(null);
    if (deleteConversation) deleteConversation(chatId);
  };

  return {
    menuOpenId,
    menuPosition,
    renamingId,
    renameValue,
    setRenameValue,
    shareModalChatId,
    setShareModalChatId,
    deleteConfirm,
    setDeleteConfirm,
    menuRef,
    menuBtnRef,
    renameInputRef,
    handleMenuToggle,
    handleRename,
    handleRenameSubmit,
    handleRenameKeyDown,
    handleShareLink,
    handleArchive,
    handleDeleteRequest,
    confirmDelete,
    closeMenu,
  };
}

const IMPORTED_CONTEXT_KEY = 'araviel-imported-context-providers';

function formatRelativeDeleted(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TrashList({
  conversations,
  total = 0,
  loading,
  error,
  restoringId,
  onRestore,
  onPurgeRequest,
  onRetry,
  onLoadMore,
  selectMode,
  selectedIds,
  onToggleSelect,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuId]);

  if (loading && conversations === null) {
    return (
      <div className={styles.skeleton}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonItem}>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle} style={{ width: `${45 + ((i * 11) % 30)}%` }} />
              <div className={styles.skeletonSub} style={{ width: `${25 + ((i * 7) % 20)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <TrashIcon />
        </div>
        <h3 className={styles.emptyTitle}>Couldn&rsquo;t load recently deleted</h3>
        <p className={styles.emptyDesc}>{error}</p>
        <button className={styles.emptyAction} onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <TrashIcon />
        </div>
        <h3 className={styles.emptyTitle}>Nothing in the bin</h3>
        <p className={styles.emptyDesc}>
          Conversations you delete will appear here for 15 days before they&rsquo;re permanently
          removed.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.trashList}>
      {conversations.map((conv) => {
        const isRestoring = restoringId === conv.id;
        const isSelected = selectMode && selectedIds?.has(conv.id);
        const daysLeft = conv.daysRemaining ?? 0;
        const handleRowClick = () => {
          if (selectMode) onToggleSelect(conv.id);
        };
        return (
          <li
            key={conv.id}
            className={`${styles.trashRow} ${isSelected ? styles.trashRowSelected : ''} ${
              selectMode ? styles.trashRowSelectMode : ''
            }`}
            onClick={handleRowClick}
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
            <div className={styles.trashMeta}>
              <span className={styles.trashTitle}>{conv.title || 'Untitled conversation'}</span>
              <span className={styles.trashSub}>
                Deleted {formatRelativeDeleted(conv.deletedAt)} ·{' '}
                <span className={styles.trashDaysLeft}>
                  {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </span>
              </span>
            </div>
            {!selectMode && (
              <div className={styles.trashRowActions}>
                <button
                  type="button"
                  className={styles.trashRestoreBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(conv.id);
                  }}
                  disabled={isRestoring}
                >
                  {isRestoring ? 'Restoring…' : 'Restore'}
                </button>
                <div className={styles.trashMenuWrapper}>
                  <button
                    type="button"
                    className={styles.trashMenuBtn}
                    aria-label="More actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === conv.id ? null : conv.id));
                    }}
                  >
                    <MoreVerticalIcon />
                  </button>
                  {openMenuId === conv.id && (
                    <div className={styles.trashMenu} onMouseDown={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`${styles.trashMenuItem} ${styles.trashMenuItemDanger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onPurgeRequest([conv.id]);
                        }}
                      >
                        <TrashIcon />
                        <span>Delete permanently</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
      {conversations.length < total && (
        <li className={styles.trashLoadMoreWrapper}>
          {loading ? (
            <div className={styles.loadingMore}>
              <div className={styles.loadingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : (
            <button type="button" className={styles.loadMoreBtn} onClick={onLoadMore}>
              Load more conversations
            </button>
          )}
        </li>
      )}
    </ul>
  );
}

function getImportedProviders(conversations) {
  const providerMap = new Map();
  for (const conv of conversations) {
    if (!providerMap.has(conv.provider)) {
      providerMap.set(conv.provider, conv.providerName || conv.provider);
    }
  }
  return [...providerMap.entries()].map(([id, name]) => ({ id, name }));
}

export default function ConversationsView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);
  const currentMessages = useSelector(selectMessages);
  const projects = useSelector(selectProjects);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [projectPickerFor, setProjectPickerFor] = useState(null);

  // Section: 'my-chats' or 'imported'
  const [activeSection, setActiveSection] = useState('my-chats');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trashedConversations, setTrashedConversations] = useState(null);
  const [trashedTotal, setTrashedTotal] = useState(0);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [purgeTargetIds, setPurgeTargetIds] = useState(null);
  const [purging, setPurging] = useState(false);
  const [bulkRestoring, setBulkRestoring] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedConversations, setImportedConversations] = useState([]);
  const [importedLoading, setImportedLoading] = useState(false);
  const [activeImportProvider, setActiveImportProvider] = useState('all');
  // Per-provider context settings: { chatgpt: true, claude: false, ... }
  const [contextProviders, setContextProviders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(IMPORTED_CONTEXT_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const listRef = useRef(null);

  // Derive starred/archived sets from conversations (API-backed via Redux)
  const starredIds = useMemo(
    () => new Set(conversations.filter((c) => c.isStarred).map((c) => c.id)),
    [conversations]
  );
  const archivedIds = useMemo(
    () => new Set(conversations.filter((c) => c.isArchived).map((c) => c.id)),
    [conversations]
  );

  const handleSingleArchive = useCallback(
    (chatId) => {
      const conv = conversations.find((c) => c.id === chatId);
      const newValue = !conv?.isArchived;
      // Optimistic update
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, isArchived: newValue } : c
          ),
          total: conversationsTotal,
        })
      );
      updateConversation(chatId, { is_archived: newValue }).catch(() => {
        dispatch(
          setConversations({
            conversations: conversations.map((c) =>
              c.id === chatId ? { ...c, isArchived: !newValue } : c
            ),
            total: conversationsTotal,
          })
        );
        showError("Couldn't archive this conversation. Try again.");
      });
    },
    [conversations, conversationsTotal, dispatch, showError]
  );

  const deleteConversation = useDeleteConversation();
  const menu = useItemMenu(conversations, conversationsTotal, dispatch, {
    onArchive: handleSingleArchive,
    deleteConversation,
  });

  const importedProviders = useMemo(
    () => getImportedProviders(importedConversations),
    [importedConversations]
  );

  const existingProviderIds = useMemo(
    () => importedProviders.map((p) => p.id),
    [importedProviders]
  );

  const loadImportedConversations = useCallback(async () => {
    setImportedLoading(true);
    try {
      const data = await fetchImportedConversations({ archived: false });
      setImportedConversations(data.conversations || []);
    } catch {
      showError("Couldn't load imported conversations.");
    } finally {
      setImportedLoading(false);
    }
  }, [showError]);

  const handleImportConversations = useCallback(
    async (newConversations, providerId, importMode) => {
      try {
        // In replace mode, delete existing conversations for this provider first
        if (importMode === 'replace') {
          const existing = importedConversations.filter((c) => c.provider === providerId);
          if (existing.length > 0) {
            await bulkDeleteImportedConversations(existing.map((c) => c.id));
          }
        }
        const payload = newConversations.map((c) => ({
          externalId: c.externalId,
          title: c.title,
          provider: c.provider,
          providerName: c.providerName,
          messages: c.messages,
          messageCount: c.messageCount,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        await importConversationsApi(payload);
        await loadImportedConversations();
      } catch (err) {
        throw err;
      }
      setActiveSection('imported');
      setActiveImportProvider(providerId);
    },
    [loadImportedConversations, importedConversations]
  );

  const toggleProviderContext = useCallback((providerId) => {
    setContextProviders((prev) => {
      const updated = { ...prev, [providerId]: !prev[providerId] };
      return updated;
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadImportedConversations();
    }
  }, [loadImportedConversations, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(IMPORTED_CONTEXT_KEY, JSON.stringify(contextProviders));
  }, [contextProviders]);

  useEffect(() => {
    if (isAuthenticated && projects.length === 0) {
      fetchProjectsApi()
        .then((data) => dispatch(setProjects(data.projects || [])))
        .catch(() => showError('Could not load projects.'));
    }
  }, [projects.length, dispatch, showError, isAuthenticated]);

  const loadTrash = useCallback(
    (offset = 0) => {
      if (!isAuthenticated) return;
      setTrashLoading(true);
      setTrashError(null);
      fetchTrashedConversations(CONVERSATIONS_PAGE_SIZE, offset)
        .then((data) => {
          const rows = data.conversations || [];
          setTrashedTotal(data.total ?? rows.length);
          setTrashedConversations((prev) => (offset === 0 ? rows : [...(prev || []), ...rows]));
        })
        .catch((err) =>
          setTrashError(err?.userMessage || "Couldn't load recently deleted conversations.")
        )
        .finally(() => setTrashLoading(false));
    },
    [isAuthenticated]
  );

  const handleLoadMoreTrash = useCallback(() => {
    if (trashLoading) return;
    loadTrash((trashedConversations || []).length);
  }, [trashLoading, loadTrash, trashedConversations]);

  useEffect(() => {
    if (activeTab === 'trash' && trashedConversations === null) {
      loadTrash(0);
    }
  }, [activeTab, trashedConversations, loadTrash]);

  const handleRestoreConversation = useCallback(
    async (chatId) => {
      if (restoringId) return;
      setRestoringId(chatId);
      try {
        await restoreConversation(chatId);
        setTrashedConversations((prev) => (prev || []).filter((c) => c.id !== chatId));
        setTrashedTotal((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent('araviel-conversation-updated'));
        showSuccess('Conversation restored');
      } catch (err) {
        showError(err?.userMessage || "Couldn't restore this conversation.");
      } finally {
        setRestoringId(null);
      }
    },
    [restoringId, showError, showSuccess]
  );

  const handleAddToProject = (chatId) => {
    menu.closeMenu();
    setProjectPickerFor(chatId);
  };

  const handleAssignProject = async (projectId) => {
    if (!projectPickerFor) return;

    // Bulk mode
    if (projectPickerFor === 'bulk') {
      const ids = [...selectedIds];
      const prevStates = conversations
        .filter((c) => ids.includes(c.id))
        .map((c) => ({ id: c.id, projectId: c.projectId }));
      // Optimistic update
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            selectedIds.has(c.id) ? { ...c, projectId } : c
          ),
          total: conversationsTotal,
        })
      );
      setProjectPickerFor(null);
      exitSelectMode();
      let failCount = 0;
      await Promise.all(
        ids.map((id) =>
          updateConversation(id, { project_id: projectId }).catch(() => {
            failCount++;
          })
        )
      );
      if (failCount > 0) {
        dispatch(
          setConversations({
            conversations: conversations.map((c) => {
              const prev = prevStates.find((p) => p.id === c.id);
              return prev ? { ...c, projectId: prev.projectId } : c;
            }),
            total: conversationsTotal,
          })
        );
        showError(`Couldn't add ${failCount} conversation(s) to project.`);
      } else {
        showSuccess(`${ids.length} conversation(s) added to project.`);
      }
      return;
    }

    // Single mode
    const chatId = projectPickerFor;
    const prevProjectId = conversations.find((c) => c.id === chatId)?.projectId;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) => (c.id === chatId ? { ...c, projectId } : c)),
        total: conversationsTotal,
      })
    );
    setProjectPickerFor(null);
    try {
      await updateConversation(chatId, { project_id: projectId });
      showSuccess('Conversation added to project.');
    } catch {
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, projectId: prevProjectId } : c
          ),
          total: conversationsTotal,
        })
      );
      showError("Couldn't move this conversation to the project.");
    }
  };

  const handleRemoveFromProject = async (chatId) => {
    menu.closeMenu();
    const prevProjectId = conversations.find((c) => c.id === chatId)?.projectId;
    dispatch(
      setConversations({
        conversations: conversations.map((c) => (c.id === chatId ? { ...c, projectId: null } : c)),
        total: conversationsTotal,
      })
    );
    try {
      await updateConversation(chatId, { project_id: null });
    } catch {
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, projectId: prevProjectId } : c
          ),
          total: conversationsTotal,
        })
      );
      showError("Couldn't remove conversation from project.");
    }
  };

  const handleBulkAddToProject = () => {
    if (!hasSelection) return;
    setProjectPickerFor('bulk');
  };

  const handleBulkRemoveFromProject = async () => {
    if (!hasSelection) return;
    const ids = [...selectedIds];
    const prevStates = conversations
      .filter((c) => ids.includes(c.id))
      .map((c) => ({ id: c.id, projectId: c.projectId }));
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) =>
          selectedIds.has(c.id) ? { ...c, projectId: null } : c
        ),
        total: conversationsTotal,
      })
    );
    exitSelectMode();
    let failCount = 0;
    await Promise.all(
      ids.map((id) =>
        updateConversation(id, { project_id: null }).catch(() => {
          failCount++;
        })
      )
    );
    if (failCount > 0) {
      // Rollback on failure
      dispatch(
        setConversations({
          conversations: conversations.map((c) => {
            const prev = prevStates.find((p) => p.id === c.id);
            return prev ? { ...c, projectId: prev.projectId } : c;
          }),
          total: conversationsTotal,
        })
      );
      showError(`Couldn't remove ${failCount} conversation(s) from project.`);
    } else {
      showSuccess('Conversations removed from project.');
    }
  };

  const loadConversations = useCallback(
    async (offset = 0) => {
      dispatch(setConversationsLoading(true));
      try {
        const data = await fetchConversations(CONVERSATIONS_PAGE_SIZE, offset);
        if (offset === 0) {
          dispatch(setConversations(data));
        } else {
          dispatch(appendConversations(data));
        }
      } catch {
        showError("Couldn't load conversations. Check your connection.");
      } finally {
        dispatch(setConversationsLoading(false));
      }
    },
    [dispatch, showError]
  );

  useEffect(() => {
    loadConversations(0);
  }, [loadConversations]);

  const handleLoadMore = useCallback(() => {
    if (!conversationsLoading && conversations.length < conversationsTotal) {
      loadConversations(conversations.length);
    }
  }, [conversationsLoading, conversations.length, conversationsTotal, loadConversations]);

  const handleChatClick = (chatId) => {
    if (selectMode) {
      toggleSelect(chatId);
      return;
    }
    dispatch(setImportedContext(null));
    navigate(`/conversations/${chatId}`);
  };

  const toggleSelect = (chatId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleStar = (ids) => {
    const allStarred = [...ids].every((id) => starredIds.has(id));
    const newValue = !allStarred;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) =>
          ids.has(c.id) ? { ...c, isStarred: newValue } : c
        ),
        total: conversationsTotal,
      })
    );
    // Persist each to backend
    ids.forEach((id) => {
      updateConversation(id, { is_starred: newValue }).catch(() => {
        showError("Couldn't update star status. Try again.");
      });
    });
    exitSelectMode();
  };

  const toggleArchive = (ids) => {
    const allArchived = [...ids].every((id) => archivedIds.has(id));
    const newValue = !allArchived;
    dispatch(
      setConversations({
        conversations: conversations.map((c) =>
          ids.has(c.id) ? { ...c, isArchived: newValue } : c
        ),
        total: conversationsTotal,
      })
    );
    ids.forEach((id) => {
      updateConversation(id, { is_archived: newValue }).catch(() => {
        showError("Couldn't update archive status. Try again.");
      });
    });
    exitSelectMode();
  };

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    deleteConversation([...selectedIds]);
    setShowDeleteConfirm(false);
    exitSelectMode();
  };

  const filteredConversations = conversations.filter((chat) => {
    if (activeTab === 'starred' && !chat.isStarred) return false;
    if (activeTab === 'archived' && !chat.isArchived) return false;
    if (activeTab === 'all' && chat.isArchived) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return chat.title?.toLowerCase().includes(q);
    }
    return true;
  });

  const groupedFilteredConversations = useMemo(
    () => groupConversationsByTime(filteredConversations),
    [filteredConversations]
  );

  const filteredImportedConversations = useMemo(() => {
    return importedConversations.filter((chat) => {
      if (activeImportProvider !== 'all' && chat.provider !== activeImportProvider) return false;
      if (chat.isArchived) return false;
      if (searchQuery.trim()) {
        return chat.title?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [importedConversations, activeImportProvider, searchQuery]);

  const groupedImportedConversations = useMemo(
    () => groupConversationsByTime(filteredImportedConversations),
    [filteredImportedConversations]
  );

  const selectAll = () => {
    let source;
    if (activeSection === 'imported') {
      source = filteredImportedConversations;
    } else if (activeTab === 'trash') {
      source = trashedConversations || [];
    } else {
      source = filteredConversations;
    }
    setSelectedIds(new Set(source.map((c) => c.id)));
  };

  const selectableCount =
    activeTab === 'trash'
      ? (trashedConversations || []).length
      : activeSection === 'imported'
      ? filteredImportedConversations.length
      : filteredConversations.length;

  const handleBulkRestore = useCallback(async () => {
    if (bulkRestoring) return;
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkRestoring(true);
    const failures = [];
    await Promise.all(
      ids.map((id) =>
        restoreConversation(id).catch(() => {
          failures.push(id);
        })
      )
    );
    setBulkRestoring(false);
    setTrashedConversations((prev) =>
      (prev || []).filter((c) => failures.includes(c.id) || !ids.includes(c.id))
    );
    const restoredCount = ids.length - failures.length;
    setTrashedTotal((prev) => Math.max(0, prev - restoredCount));
    setSelectedIds(new Set(failures));
    if (failures.length === 0) setSelectMode(false);
    window.dispatchEvent(new CustomEvent('araviel-conversation-updated'));
    if (restoredCount > 0) {
      showSuccess(`${restoredCount} conversation${restoredCount === 1 ? '' : 's'} restored.`);
    }
    if (failures.length > 0) {
      showError(
        failures.length === ids.length
          ? "Couldn't restore the selected conversations."
          : `Couldn't restore ${failures.length} of ${ids.length}.`
      );
    }
  }, [bulkRestoring, selectedIds, showError, showSuccess]);

  const runPurge = useCallback(
    async (ids) => {
      if (purging || ids.length === 0) return;
      setPurging(true);
      const failures = [];
      await Promise.all(
        ids.map((id) =>
          purgeConversation(id).catch(() => {
            failures.push(id);
          })
        )
      );
      setPurging(false);
      setTrashedConversations((prev) =>
        (prev || []).filter((c) => failures.includes(c.id) || !ids.includes(c.id))
      );
      const purgedCount = ids.length - failures.length;
      setTrashedTotal((prev) => Math.max(0, prev - purgedCount));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (!failures.includes(id)) next.delete(id);
        });
        return next;
      });
      setPurgeTargetIds(null);
      if (purgedCount > 0 && failures.length === 0) {
        setSelectMode(false);
      }
      if (purgedCount > 0) {
        showSuccess(
          `${purgedCount} conversation${purgedCount === 1 ? '' : 's'} permanently deleted.`
        );
      }
      if (failures.length > 0) {
        showError(
          failures.length === ids.length
            ? "Couldn't permanently delete the selected conversations."
            : `Couldn't delete ${failures.length} of ${ids.length}.`
        );
      }
    },
    [purging, showError, showSuccess]
  );

  // Imported conversations filtering
  const handleImportedChatClick = async (chat) => {
    if (selectMode) {
      toggleSelect(chat.id);
      return;
    }
    // Clear the native conversation ID so the backend creates a new one on first send
    dispatch(setCurrentChat(null));
    navigate('/');
    dispatch(setMessages([]));
    try {
      const data = await fetchImportedConversationMessages(chat.id);
      const mappedMessages = (data.messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt).getTime(),
        isImported: true,
        ...(msg.role === 'assistant' && {
          modelName: chat.providerName,
          provider: chat.provider,
        }),
      }));
      dispatch(setMessages(mappedMessages));
      // Store imported context so runSSEPipeline can pass the ID to the backend
      dispatch(
        setImportedContext({
          importedConversationId: chat.id,
          provider: chat.provider,
          providerName: chat.providerName,
          title: chat.title,
        })
      );
    } catch {
      // Silently fail
    }
  };

  const handleDeleteImported = async (chatId) => {
    setImportedConversations((prev) => prev.filter((c) => c.id !== chatId));
    try {
      await deleteImportedConversation(chatId);
    } catch {
      loadImportedConversations();
    }
  };

  const handleBulkDeleteImported = async () => {
    const idsToDelete = [...selectedIds];
    setImportedConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)));
    setShowDeleteConfirm(false);
    exitSelectMode();
    try {
      await bulkDeleteImportedConversations(idsToDelete);
    } catch {
      loadImportedConversations();
    }
  };

  const toggleImportedStar = async (ids) => {
    const idList = [...ids];
    const allStarred = idList.every(
      (id) => importedConversations.find((c) => c.id === id)?.isStarred
    );
    const newVal = !allStarred;
    setImportedConversations((prev) =>
      prev.map((c) => (ids.has(c.id) ? { ...c, isStarred: newVal } : c))
    );
    exitSelectMode();
    try {
      await bulkUpdateImportedConversations(idList, { isStarred: newVal });
    } catch {
      loadImportedConversations();
    }
  };

  const toggleImportedArchive = async (ids) => {
    const idList = [...ids];
    const allArchived = idList.every(
      (id) => importedConversations.find((c) => c.id === id)?.isArchived
    );
    const newVal = !allArchived;
    setImportedConversations((prev) =>
      prev.map((c) => (ids.has(c.id) ? { ...c, isArchived: newVal } : c))
    );
    exitSelectMode();
    try {
      await bulkUpdateImportedConversations(idList, { isArchived: newVal });
    } catch {
      loadImportedConversations();
    }
  };

  const hasSelection = selectedIds.size > 0;

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const oneDay = 86400000;

    if (diff < oneDay) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 2 * oneDay) return 'Yesterday';
    if (diff < 7 * oneDay) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItemMenu = (chat) => (
    <>
      <button
        ref={menu.menuOpenId === chat.id ? menu.menuBtnRef : null}
        className={`${styles.itemMenuBtn} ${
          menu.menuOpenId === chat.id ? styles.itemMenuBtnVisible : ''
        }`}
        onClick={(e) => menu.handleMenuToggle(e, chat.id)}
        aria-label="Chat options"
      >
        <MoreVerticalIcon />
      </button>
      {menu.menuOpenId === chat.id && (
        <div ref={menu.menuRef} className={styles.itemDropdown} style={menu.menuPosition}>
          <button
            className={styles.itemDropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              menu.handleShareLink(chat.id);
            }}
          >
            <ShareIcon />
            <span>Share</span>
          </button>
          <button
            className={styles.itemDropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              menu.handleRename(chat);
            }}
          >
            <EditIcon />
            <span>Rename</span>
          </button>
          <button
            className={styles.itemDropdownItem}
            onClick={(e) => {
              e.stopPropagation();
              menu.handleArchive(chat.id);
            }}
          >
            <ArchiveIcon />
            <span>{archivedIds.has(chat.id) ? 'Move to Chats' : 'Archive'}</span>
          </button>
          {chat.projectId ? (
            <button
              className={styles.itemDropdownItem}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromProject(chat.id);
              }}
            >
              <ProjectsIcon />
              <span>Remove from project</span>
            </button>
          ) : (
            <button
              className={styles.itemDropdownItem}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToProject(chat.id);
              }}
            >
              <ProjectsIcon />
              <span>Add to project</span>
            </button>
          )}
          <div className={styles.itemDropdownDivider} />
          <button
            className={`${styles.itemDropdownItem} ${styles.itemDropdownItemDanger}`}
            onClick={(e) => {
              e.stopPropagation();
              menu.handleDeleteRequest(chat.id);
            }}
          >
            <TrashIcon />
            <span>Delete</span>
          </button>
        </div>
      )}
    </>
  );

  const renderConversationItem = (chat, { isImported = false } = {}) => {
    const isSelected = selectedIds.has(chat.id);
    const isCurrent = currentChatId === chat.id;
    const isStarred = !!chat.isStarred;
    const isRenaming = menu.renamingId === chat.id;
    const ProviderLogo = isImported ? getProviderLogo(chat.provider) : null;

    return (
      <div
        key={chat.id}
        className={`${styles.item} ${isSelected ? styles.itemSelected : ''} ${
          isCurrent && !selectMode ? styles.itemCurrent : ''
        }`}
        onClick={() => {
          if (isRenaming) return;
          if (isImported) handleImportedChatClick(chat);
          else handleChatClick(chat.id);
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
        {isImported && ProviderLogo && (
          <div className={styles.itemProviderIcon}>
            <ProviderLogo size={16} />
          </div>
        )}
        <div className={styles.itemBody}>
          <div className={styles.itemTop}>
            {isRenaming ? (
              <input
                ref={menu.renameInputRef}
                className={styles.itemRenameInput}
                value={menu.renameValue}
                onChange={(e) => menu.setRenameValue(e.target.value)}
                onKeyDown={(e) => menu.handleRenameKeyDown(e, chat.id)}
                onBlur={() => menu.handleRenameSubmit(chat.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className={styles.itemTitle}>{chat.title || 'Untitled'}</span>
                {isStarred && (
                  <span className={styles.itemStarBadge}>
                    <StarIcon filled />
                  </span>
                )}
              </>
            )}
          </div>
          <span className={styles.itemMeta}>
            {isImported
              ? `From ${chat.providerName} \u00B7 ${formatRelativeTime(
                  chat.updatedAt || chat.createdAt
                )}`
              : `Last message ${formatRelativeTime(chat.updatedAt || chat.createdAt)}`}
          </span>
        </div>
        <span className={styles.itemTime}>{formatDate(chat.updatedAt || chat.createdAt)}</span>
        {!selectMode && !isImported && renderItemMenu(chat)}
        {!selectMode && isImported && (
          <button
            className={`${styles.itemMenuBtn} ${styles.itemMenuBtnVisible}`}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteImported(chat.id);
            }}
            aria-label="Delete imported chat"
            title="Delete"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    );
  };

  const isImportedSection = activeSection === 'imported';
  const currentFilteredList = isImportedSection
    ? filteredImportedConversations
    : filteredConversations;

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Chats</h1>
          </div>
          <GuestGate
            icon={<ChatIcon />}
            title="Your conversations live here"
            description="Sign in to save your chats, access conversation history, and pick up where you left off."
            actionLabel="Sign in to view chats"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Chats</h1>
          <div className={styles.headerActions}>
            <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
              <ImportIcon />
              <span>Import</span>
            </button>
            <button
              className={styles.newChatBtn}
              onClick={() => {
                dispatch(createNewChat());
                navigate('/');
              }}
            >
              <PlusIcon />
              <span>New chat</span>
            </button>
          </div>
        </div>

        {/* Section switcher */}
        <div className={styles.sectionSwitcher}>
          <button
            className={`${styles.sectionTab} ${
              activeSection === 'my-chats' ? styles.sectionTabActive : ''
            }`}
            onClick={() => {
              setActiveSection('my-chats');
              exitSelectMode();
              setSearchQuery('');
            }}
          >
            <ChatIcon />
            <span>My Chats</span>
          </button>
          <button
            className={`${styles.sectionTab} ${
              activeSection === 'imported' ? styles.sectionTabActive : ''
            }`}
            onClick={() => {
              setActiveSection('imported');
              exitSelectMode();
              setSearchQuery('');
            }}
          >
            <ImportIcon />
            <span>Imported Chats</span>
          </button>
        </div>

        {/* Search bar */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchIcon}>
            <SearchIcon />
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={isImportedSection ? 'Search imported chats...' : 'Search your chats...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* My Chats Section */}
        {!isImportedSection && (
          <>
            {/* Toolbar: Tabs + Select toggle */}
            <div className={styles.toolbar}>
              <div className={styles.tabs}>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      exitSelectMode();
                    }}
                  >
                    {tab.label}
                    {tab.id === 'starred' && starredIds.size > 0 && (
                      <span className={styles.tabBadge}>{starredIds.size}</span>
                    )}
                    {tab.id === 'archived' && archivedIds.size > 0 && (
                      <span className={styles.tabBadge}>{archivedIds.size}</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className={`${styles.selectToggle} ${selectMode ? styles.selectToggleActive : ''}`}
                onClick={() => {
                  if (selectMode) {
                    exitSelectMode();
                  } else {
                    setSelectMode(true);
                  }
                }}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            </div>

            {selectMode && (
              <div className={styles.selectionBar}>
                <div className={styles.selectionLeft}>
                  <span className={styles.selectionCount}>{selectedIds.size} selected</span>
                  {selectedIds.size < selectableCount && (
                    <button className={styles.selectAllBtn} onClick={selectAll}>
                      Select all
                    </button>
                  )}
                </div>
                <div className={styles.selectionActions}>
                  {activeTab === 'trash' ? (
                    <>
                      <button
                        className={styles.selectionAction}
                        onClick={() => hasSelection && handleBulkRestore()}
                        disabled={!hasSelection || bulkRestoring}
                        title="Restore"
                      >
                        <RefreshIcon />
                      </button>
                      <button
                        className={`${styles.selectionAction} ${styles.selectionActionDanger}`}
                        onClick={() => hasSelection && setPurgeTargetIds([...selectedIds])}
                        disabled={!hasSelection || purging}
                        title="Delete permanently"
                      >
                        <TrashIcon />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={styles.selectionAction}
                        onClick={() => hasSelection && handleBulkAddToProject()}
                        disabled={!hasSelection}
                        title="Add to project"
                      >
                        <ProjectsIcon />
                      </button>
                      <button
                        className={styles.selectionAction}
                        onClick={() => hasSelection && handleBulkRemoveFromProject()}
                        disabled={!hasSelection}
                        title="Remove from project"
                      >
                        <LinkIcon />
                      </button>
                      <button
                        className={styles.selectionAction}
                        onClick={() => hasSelection && toggleStar(selectedIds)}
                        disabled={!hasSelection}
                        title="Star"
                      >
                        <StarIcon />
                      </button>
                      <button
                        className={styles.selectionAction}
                        onClick={() => hasSelection && toggleArchive(selectedIds)}
                        disabled={!hasSelection}
                        title={activeTab === 'archived' ? 'Move to Chats' : 'Archive'}
                      >
                        <ArchiveIcon />
                      </button>
                      <button
                        className={`${styles.selectionAction} ${styles.selectionActionDanger}`}
                        onClick={() => hasSelection && handleBulkDelete()}
                        disabled={!hasSelection}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                </div>
                <button
                  className={styles.selectionClose}
                  onClick={exitSelectMode}
                  aria-label="Exit selection"
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            <div className={styles.list} ref={listRef}>
              {activeTab === 'trash' ? (
                <TrashList
                  conversations={trashedConversations}
                  total={trashedTotal}
                  loading={trashLoading}
                  error={trashError}
                  restoringId={restoringId}
                  onRestore={handleRestoreConversation}
                  onPurgeRequest={setPurgeTargetIds}
                  onRetry={() => loadTrash(0)}
                  onLoadMore={handleLoadMoreTrash}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              ) : conversationsLoading && conversations.length === 0 ? (
                <div className={styles.skeleton}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={styles.skeletonItem}>
                      <div className={styles.skeletonContent}>
                        <div
                          className={styles.skeletonTitle}
                          style={{ width: `${45 + ((i * 11) % 30)}%` }}
                        />
                        <div
                          className={styles.skeletonSub}
                          style={{ width: `${25 + ((i * 7) % 20)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedFilteredConversations.length > 0 ? (
                <>
                  {groupedFilteredConversations.map((group) => (
                    <div key={group.label} className={styles.timeGroup}>
                      <div className={styles.timeGroupLabel}>{group.label}</div>
                      {group.items.map((chat) => renderConversationItem(chat))}
                    </div>
                  ))}
                  {conversations.length < conversationsTotal && (
                    <div className={styles.loadMoreWrapper}>
                      {conversationsLoading ? (
                        <div className={styles.loadingMore}>
                          <div className={styles.loadingDots}>
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      ) : (
                        <button className={styles.loadMoreBtn} onClick={handleLoadMore}>
                          Load more conversations
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <ChatIcon />
                  </div>
                  <h3 className={styles.emptyTitle}>
                    {activeTab === 'starred'
                      ? 'No starred chats'
                      : activeTab === 'archived'
                      ? 'No archived chats'
                      : searchQuery
                      ? 'No results found'
                      : 'No chats yet'}
                  </h3>
                  <p className={styles.emptyDesc}>
                    {activeTab === 'starred'
                      ? 'Star your important conversations to find them quickly.'
                      : activeTab === 'archived'
                      ? 'Archived conversations will appear here.'
                      : searchQuery
                      ? 'Try a different search term.'
                      : 'Start a new chat to begin a conversation.'}
                  </p>
                  {!searchQuery && activeTab === 'all' && (
                    <button
                      className={styles.emptyAction}
                      onClick={() => {
                        dispatch(createNewChat());
                        navigate('/');
                      }}
                    >
                      <PlusIcon />
                      <span>New chat</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Imported Chats Section */}
        {isImportedSection && (
          <>
            {/* Provider filter tabs */}
            {importedProviders.length > 0 && (
              <div className={styles.toolbar}>
                <div className={styles.providerFilters}>
                  <button
                    className={`${styles.tab} ${
                      activeImportProvider === 'all' ? styles.tabActive : ''
                    }`}
                    onClick={() => {
                      setActiveImportProvider('all');
                      exitSelectMode();
                    }}
                  >
                    All
                    <span className={styles.tabBadge}>{importedConversations.length}</span>
                  </button>
                  {importedProviders.map((p) => {
                    const count = importedConversations.filter((c) => c.provider === p.id).length;
                    const ProviderLogo = getProviderLogo(p.id);
                    return (
                      <button
                        key={p.id}
                        className={`${styles.tab} ${
                          activeImportProvider === p.id ? styles.tabActive : ''
                        }`}
                        onClick={() => {
                          setActiveImportProvider(p.id);
                          exitSelectMode();
                        }}
                      >
                        <span className={styles.tabProviderIcon}>
                          <ProviderLogo size={14} />
                        </span>
                        {p.name}
                        <span className={styles.tabBadge}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  className={`${styles.selectToggle} ${
                    selectMode ? styles.selectToggleActive : ''
                  }`}
                  onClick={() => {
                    if (selectMode) exitSelectMode();
                    else setSelectMode(true);
                  }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            )}

            {/* Compact context bar */}
            {importedProviders.length > 0 && (
              <div className={styles.contextBar}>
                <span className={styles.contextBarLabel}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Context</span>
                </span>
                <div className={styles.contextBarDivider} />
                <div className={styles.contextBarChips}>
                  {(activeImportProvider === 'all'
                    ? importedProviders
                    : importedProviders.filter((p) => p.id === activeImportProvider)
                  ).map((p) => {
                    const ProviderLogo = getProviderLogo(p.id);
                    const isEnabled = !!contextProviders[p.id];
                    return (
                      <button
                        key={p.id}
                        className={`${styles.contextChip} ${
                          isEnabled ? styles.contextChipActive : ''
                        }`}
                        onClick={() => toggleProviderContext(p.id)}
                        title={isEnabled ? `Disable ${p.name} context` : `Enable ${p.name} context`}
                      >
                        <ProviderLogo size={13} />
                        <span>{p.name}</span>
                        <span className={styles.contextChipDot} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selection action bar for imported */}
            {selectMode && (
              <div className={styles.selectionBar}>
                <div className={styles.selectionLeft}>
                  <span className={styles.selectionCount}>{selectedIds.size} selected</span>
                  {selectedIds.size < filteredImportedConversations.length && (
                    <button className={styles.selectAllBtn} onClick={selectAll}>
                      Select all
                    </button>
                  )}
                </div>
                <div className={styles.selectionActions}>
                  <button
                    className={styles.selectionAction}
                    onClick={() => hasSelection && toggleImportedStar(selectedIds)}
                    disabled={!hasSelection}
                    title="Star"
                  >
                    <StarIcon />
                  </button>
                  <button
                    className={styles.selectionAction}
                    onClick={() => hasSelection && toggleImportedArchive(selectedIds)}
                    disabled={!hasSelection}
                    title={activeTab === 'archived' ? 'Move to Chats' : 'Archive'}
                  >
                    <ArchiveIcon />
                  </button>
                  <button
                    className={`${styles.selectionAction} ${styles.selectionActionDanger}`}
                    onClick={() => hasSelection && handleBulkDelete()}
                    disabled={!hasSelection}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <button
                  className={styles.selectionClose}
                  onClick={exitSelectMode}
                  aria-label="Exit selection"
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            {/* Imported conversations list */}
            <div className={styles.list}>
              {groupedImportedConversations.length > 0 ? (
                groupedImportedConversations.map((group) => (
                  <div key={group.label} className={styles.timeGroup}>
                    <div className={styles.timeGroupLabel}>{group.label}</div>
                    {group.items.map((chat) => renderConversationItem(chat, { isImported: true }))}
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <ImportIcon />
                  </div>
                  <h3 className={styles.emptyTitle}>
                    {searchQuery ? 'No results found' : 'No imported chats yet'}
                  </h3>
                  <p className={styles.emptyDesc}>
                    {searchQuery
                      ? 'Try a different search term.'
                      : 'Bring your conversations from ChatGPT, Claude, Gemini, and more.'}
                  </p>
                  {!searchQuery && (
                    <button className={styles.emptyAction} onClick={() => setShowImportModal(true)}>
                      <ImportIcon />
                      <span>Import conversations</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating action bar for selections */}
      {hasSelection && !selectMode && (
        <div className={styles.floatingBar}>
          <div className={styles.floatingBarInner}>
            <button
              className={styles.floatingAction}
              onClick={() =>
                isImportedSection ? toggleImportedStar(selectedIds) : toggleStar(selectedIds)
              }
              title="Star"
            >
              <StarIcon />
              <span>Star</span>
            </button>
            <button
              className={styles.floatingAction}
              onClick={() =>
                isImportedSection ? toggleImportedArchive(selectedIds) : toggleArchive(selectedIds)
              }
              title={activeTab === 'archived' ? 'Move to Chats' : 'Archive'}
            >
              <ArchiveIcon />
              <span>{activeTab === 'archived' ? 'Move to Chats' : 'Archive'}</span>
            </button>
            <div className={styles.floatingDivider} />
            <button
              className={`${styles.floatingAction} ${styles.floatingActionDanger}`}
              onClick={() => {
                if (isImportedSection) handleBulkDelete();
                else handleBulkDelete();
              }}
              title="Delete"
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {purgeTargetIds && purgeTargetIds.length > 0 && (
        <div
          className={styles.confirmOverlay}
          onClick={() => (purging ? null : setPurgeTargetIds(null))}
        >
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>
              Permanently delete {purgeTargetIds.length} chat
              {purgeTargetIds.length === 1 ? '' : 's'}?
            </h3>
            <p className={styles.confirmDesc}>
              This skips the 15-day recovery window. The chat
              {purgeTargetIds.length === 1 ? '' : 's'} and all messages will be removed immediately
              and cannot be restored.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setPurgeTargetIds(null)}
                disabled={purging}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={() => runPurge(purgeTargetIds)}
                disabled={purging}
              >
                {purging ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>
              Delete {selectedIds.size} chat{selectedIds.size > 1 ? 's' : ''}?
            </h3>
            <p className={styles.confirmDesc}>
              This action is permanent and cannot be undone. All messages in the selected chat
              {selectedIds.size > 1 ? 's' : ''} will be lost.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={isImportedSection ? handleBulkDeleteImported : confirmBulkDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal — matches the conversation top-nav share affordance. */}
      {menu.shareModalChatId && (
        <ShareModal
          conversationId={menu.shareModalChatId}
          conversationTitle={conversations.find((c) => c.id === menu.shareModalChatId)?.title}
          messages={menu.shareModalChatId === currentChatId ? currentMessages : undefined}
          onClose={() => menu.setShareModalChatId(null)}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {/* Single item delete confirmation */}
      {menu.deleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => menu.setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>Delete this chat?</h3>
            <p className={styles.confirmDesc}>
              This action is permanent and cannot be undone. All messages in this conversation will
              be lost.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => menu.setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={menu.confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import conversations modal */}
      {showImportModal && (
        <ImportConversationsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportConversations}
          existingProviders={existingProviderIds}
        />
      )}

      {/* Project picker dialog */}
      {projectPickerFor && (
        <ProjectPickerModal
          onSelect={handleAssignProject}
          onClose={() => setProjectPickerFor(null)}
          onError={showError}
        />
      )}
    </div>
  );
}
