import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectConversations,
  selectConversationsTotal,
  selectConversationsLoading,
  selectCurrentChatId,
  setConversations,
  appendConversations,
  setConversationsLoading,
  setCurrentChat,
  setMessages,
  createNewChat,
} from '../../store/slices/chatSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { fetchConversations, fetchConversationMessages } from '../../services/api';
import { getGeneratedImages } from '../../services/imageGeneration';
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
  ChevronRightIcon,
  DownloadIcon,
  LinkIcon,
} from '../Icons';
import styles from './ConversationsView.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
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

function useItemMenu(conversations, conversationsTotal, dispatch) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [shareSubOpen, setShareSubOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({});
  const [shareSubPosition, setShareSubPosition] = useState({});
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareLinkConfirm, setShareLinkConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const renameInputRef = useRef(null);

  // Calculate dropdown position based on trigger button
  const computePosition = useCallback((btnEl) => {
    if (!btnEl) return;
    const rect = btnEl.getBoundingClientRect();
    const menuHeight = 200;
    const menuWidth = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;

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

    if (spaceRight < menuWidth) {
      pos.right = '0';
      pos.left = 'auto';
    } else {
      pos.right = '0';
      pos.left = 'auto';
    }

    setMenuPosition(pos);

    // Share submenu
    const subH = 90;
    const subPos = {};
    if (spaceBelow < subH + 40 && spaceAbove > spaceBelow) {
      subPos.bottom = '0';
      subPos.top = 'auto';
    } else {
      subPos.top = '0';
      subPos.bottom = 'auto';
    }

    if (spaceRight < menuWidth + 170) {
      subPos.right = '100%';
      subPos.left = 'auto';
      subPos.marginRight = '4px';
    } else {
      subPos.left = '100%';
      subPos.right = 'auto';
      subPos.marginLeft = '4px';
    }
    setShareSubPosition(subPos);
  }, []);

  const handleMenuToggle = useCallback(
    (e, chatId) => {
      e.stopPropagation();
      setShareSubOpen(false);
      if (menuOpenId === chatId) {
        setMenuOpenId(null);
      } else {
        setMenuOpenId(chatId);
        computePosition(e.currentTarget);
      }
    },
    [menuOpenId, computePosition]
  );

  // Close menu on outside click or Escape
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
        setShareSubOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (shareSubOpen) {
          setShareSubOpen(false);
        } else {
          setMenuOpenId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpenId, shareSubOpen]);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const closeMenu = () => {
    setMenuOpenId(null);
    setShareSubOpen(false);
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
    setShareLinkConfirm(chatId);
  };

  const confirmShareLink = () => {
    const url = `${window.location.origin}/chat/${shareLinkConfirm}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => {
      setShareLinkConfirm(null);
      setLinkCopied(false);
    }, 1500);
  };

  const handleSharePdf = (chatId) => {
    closeMenu();
    const chat = conversations.find((c) => c.id === chatId);
    const title = chat?.title || 'conversation';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #333; }
            h1 { font-size: 22px; margin-bottom: 8px; }
            .meta { color: #888; font-size: 13px; margin-bottom: 32px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Exported from Araviel</p>
          <p style="color:#888;font-size:13px;">Use your browser's Print dialog to save as PDF.</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const handleArchive = (chatId) => {
    closeMenu();
    try {
      const archived = new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
      if (archived.has(chatId)) {
        archived.delete(chatId);
      } else {
        archived.add(chatId);
      }
      localStorage.setItem('araviel-archived-chats', JSON.stringify([...archived]));
    } catch {
      // Silently fail
    }
  };

  const handleDeleteRequest = (chatId) => {
    closeMenu();
    setDeleteConfirm(chatId);
  };

  const confirmDelete = () => {
    const chatId = deleteConfirm;
    dispatch(
      setConversations({
        conversations: conversations.filter((c) => c.id !== chatId),
        total: Math.max(0, conversationsTotal - 1),
      })
    );
    try {
      const starred = new Set(JSON.parse(localStorage.getItem('araviel-starred-chats') || '[]'));
      const archived = new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
      starred.delete(chatId);
      archived.delete(chatId);
      localStorage.setItem('araviel-starred-chats', JSON.stringify([...starred]));
      localStorage.setItem('araviel-archived-chats', JSON.stringify([...archived]));
    } catch {
      // Silently fail
    }
    setDeleteConfirm(null);
  };

  return {
    menuOpenId,
    shareSubOpen,
    setShareSubOpen,
    menuPosition,
    shareSubPosition,
    renamingId,
    renameValue,
    setRenameValue,
    shareLinkConfirm,
    setShareLinkConfirm,
    deleteConfirm,
    setDeleteConfirm,
    linkCopied,
    menuRef,
    menuBtnRef,
    renameInputRef,
    handleMenuToggle,
    handleRename,
    handleRenameSubmit,
    handleRenameKeyDown,
    handleShareLink,
    confirmShareLink,
    handleSharePdf,
    handleArchive,
    handleDeleteRequest,
    confirmDelete,
    closeMenu,
  };
}

export default function ConversationsView() {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('araviel-starred-chats') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [archivedIds, setArchivedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const listRef = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const menu = useItemMenu(conversations, conversationsTotal, dispatch);

  useEffect(() => {
    localStorage.setItem('araviel-starred-chats', JSON.stringify([...starredIds]));
  }, [starredIds]);

  useEffect(() => {
    localStorage.setItem('araviel-archived-chats', JSON.stringify([...archivedIds]));
  }, [archivedIds]);

  const loadConversations = useCallback(
    async (offset = 0) => {
      dispatch(setConversationsLoading(true));
      try {
        const data = await fetchConversations(20, offset);
        if (offset === 0) {
          dispatch(setConversations(data));
        } else {
          dispatch(appendConversations(data));
        }
      } catch {
        // Silently fail
      } finally {
        dispatch(setConversationsLoading(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    loadConversations(0);
  }, [loadConversations]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !conversationsLoading &&
          conversations.length < conversationsTotal
        ) {
          loadConversations(conversations.length);
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [conversations.length, conversationsTotal, conversationsLoading, loadConversations]);

  const handleChatClick = async (chatId) => {
    if (selectMode) {
      toggleSelect(chatId);
      return;
    }
    dispatch(setCurrentChat(chatId));
    dispatch(setActiveItem('home'));
    try {
      const data = await fetchConversationMessages(chatId);
      const storedImages = getGeneratedImages();
      const mappedMessages = (data.messages || []).map((msg) => {
        const base = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt).getTime(),
        };
        if (msg.role === 'assistant') {
          let generatedImages = msg.generatedImages || [];
          if (generatedImages.length === 0) {
            const msgTime = new Date(msg.createdAt).getTime();
            const matched = storedImages.filter((img) => Math.abs(img.createdAt - msgTime) < 30000);
            if (matched.length > 0) {
              generatedImages = matched.map((img) => ({
                url: img.url,
                prompt: img.prompt,
                model: img.model,
                provider: img.provider,
                id: img.id,
              }));
            }
          }
          Object.assign(base, {
            modelId: msg.model?.id,
            modelName: msg.model?.name,
            provider: msg.model?.provider,
            score: msg.model?.score,
            reasoning: msg.model?.reasoning,
            alternateModels: (msg.alternateModels || []).map((m) => ({
              modelId: m.id,
              modelName: m.name,
              provider: m.provider,
              score: m.score,
              reasoning: m.reasoning,
            })),
            thinkingContent: msg.thinkingContent,
            citations: msg.citations,
            usage: msg.usage,
            costUsd: msg.costUsd,
            latencyMs: msg.latencyMs,
            adeLatencyMs: msg.adeLatencyMs,
            ...(generatedImages.length > 0 && { generatedImages }),
          });
        }
        return base;
      });
      dispatch(setMessages(mappedMessages));
    } catch {
      // Fail silently
    }
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
    setStarredIds((prev) => {
      const next = new Set(prev);
      const allStarred = [...ids].every((id) => next.has(id));
      ids.forEach((id) => {
        if (allStarred) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
    exitSelectMode();
  };

  const toggleArchive = (ids) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      const allArchived = [...ids].every((id) => next.has(id));
      ids.forEach((id) => {
        if (allArchived) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
    exitSelectMode();
  };

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.delete(id));
      return next;
    });
    setArchivedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.delete(id));
      return next;
    });
    setShowDeleteConfirm(false);
    exitSelectMode();
  };

  const filteredConversations = conversations.filter((chat) => {
    if (activeTab === 'starred' && !starredIds.has(chat.id)) return false;
    if (activeTab === 'archived' && !archivedIds.has(chat.id)) return false;
    if (activeTab === 'all' && archivedIds.has(chat.id)) return false;

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

  const selectAll = () => {
    setSelectedIds(new Set(filteredConversations.map((c) => c.id)));
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
          <div
            className={styles.itemDropdownItemWithSub}
            onMouseEnter={() => menu.setShareSubOpen(true)}
            onMouseLeave={() => menu.setShareSubOpen(false)}
          >
            <button
              className={styles.itemDropdownItem}
              onClick={(e) => {
                e.stopPropagation();
                menu.setShareSubOpen((v) => !v);
              }}
            >
              <ShareIcon />
              <span>Share</span>
              <span className={styles.itemDropdownChevron}>
                <ChevronRightIcon />
              </span>
            </button>
            {menu.shareSubOpen && (
              <div className={styles.itemSubDropdown} style={menu.shareSubPosition}>
                <button
                  className={styles.itemDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    menu.handleSharePdf(chat.id);
                  }}
                >
                  <DownloadIcon />
                  <span>Share as PDF</span>
                </button>
                <button
                  className={styles.itemDropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    menu.handleShareLink(chat.id);
                  }}
                >
                  <LinkIcon />
                  <span>Share link</span>
                </button>
              </div>
            )}
          </div>
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
            <span>Archive</span>
          </button>
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

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Chats</h1>
          <button
            className={styles.newChatBtn}
            onClick={() => {
              dispatch(createNewChat());
              dispatch(setActiveItem('home'));
            }}
          >
            <PlusIcon />
            <span>New chat</span>
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
            placeholder="Search your chats..."
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

        {/* Selection action bar */}
        {selectMode && (
          <div className={styles.selectionBar}>
            <div className={styles.selectionLeft}>
              <span className={styles.selectionCount}>{selectedIds.size} selected</span>
              {selectedIds.size < filteredConversations.length && (
                <button className={styles.selectAllBtn} onClick={selectAll}>
                  Select all
                </button>
              )}
            </div>
            <div className={styles.selectionActions}>
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
                title={activeTab === 'archived' ? 'Unarchive' : 'Archive'}
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

        {/* Conversation list */}
        <div className={styles.list} ref={listRef}>
          {conversationsLoading && conversations.length === 0 ? (
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
                  {group.items.map((chat) => {
                    const isSelected = selectedIds.has(chat.id);
                    const isCurrent = currentChatId === chat.id;
                    const isStarred = starredIds.has(chat.id);
                    const isRenaming = menu.renamingId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        className={`${styles.item} ${isSelected ? styles.itemSelected : ''} ${
                          isCurrent && !selectMode ? styles.itemCurrent : ''
                        }`}
                        onClick={() => !isRenaming && handleChatClick(chat.id)}
                      >
                        {selectMode && (
                          <div className={styles.checkboxArea}>
                            <div
                              className={`${styles.checkbox} ${
                                isSelected ? styles.checkboxChecked : ''
                              }`}
                            >
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
                            Last message {formatRelativeTime(chat.updatedAt || chat.createdAt)}
                          </span>
                        </div>
                        <span className={styles.itemTime}>
                          {formatDate(chat.updatedAt || chat.createdAt)}
                        </span>
                        {!selectMode && renderItemMenu(chat)}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={sentinelRef} className={styles.sentinel}>
                {conversationsLoading && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingDots}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>
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
                    dispatch(setActiveItem('home'));
                  }}
                >
                  <PlusIcon />
                  <span>New chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating action bar for selections */}
      {hasSelection && !selectMode && (
        <div className={styles.floatingBar}>
          <div className={styles.floatingBarInner}>
            <button
              className={styles.floatingAction}
              onClick={() => toggleStar(selectedIds)}
              title="Star"
            >
              <StarIcon />
              <span>Star</span>
            </button>
            <button
              className={styles.floatingAction}
              onClick={() => toggleArchive(selectedIds)}
              title={activeTab === 'archived' ? 'Unarchive' : 'Archive'}
            >
              <ArchiveIcon />
              <span>{activeTab === 'archived' ? 'Unarchive' : 'Archive'}</span>
            </button>
            <div className={styles.floatingDivider} />
            <button
              className={`${styles.floatingAction} ${styles.floatingActionDanger}`}
              onClick={handleBulkDelete}
              title="Delete"
            >
              <TrashIcon />
              <span>Delete</span>
            </button>
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
              <button className={styles.confirmDeleteBtn} onClick={confirmBulkDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share link confirmation */}
      {menu.shareLinkConfirm && (
        <div className={styles.confirmOverlay} onClick={() => menu.setShareLinkConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIconShare}>
              <LinkIcon />
            </div>
            <h3 className={styles.confirmTitle}>Share this conversation?</h3>
            <p className={styles.confirmDesc}>
              A shareable link will be copied to your clipboard. Anyone with this link will be able
              to view the conversation.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => menu.setShareLinkConfirm(null)}
              >
                Cancel
              </button>
              <button className={styles.confirmShareBtn} onClick={menu.confirmShareLink}>
                {menu.linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}
