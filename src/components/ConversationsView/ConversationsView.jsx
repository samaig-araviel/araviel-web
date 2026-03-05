import { useState, useEffect, useCallback, useRef } from 'react';
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
  FlagIcon,
  TrashIcon,
  CloseIcon,
  ChatIcon,
  PlusIcon,
} from '../Icons';
import styles from './ConversationsView.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
];

export default function ConversationsView() {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Persist starred/archived to localStorage
  useEffect(() => {
    localStorage.setItem('araviel-starred-chats', JSON.stringify([...starredIds]));
  }, [starredIds]);

  useEffect(() => {
    localStorage.setItem('araviel-archived-chats', JSON.stringify([...archivedIds]));
  }, [archivedIds]);

  // Load conversations on mount
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

  // Infinite scroll with IntersectionObserver
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

  const clearSelection = () => setSelectedIds(new Set());

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
    clearSelection();
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
    clearSelection();
  };

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    // For now, just clear selection and remove from starred/archived
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
    clearSelection();
  };

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((chat) => {
    // Tab filter
    if (activeTab === 'starred' && !starredIds.has(chat.id)) return false;
    if (activeTab === 'archived' && !archivedIds.has(chat.id)) return false;
    if (activeTab === 'all' && archivedIds.has(chat.id)) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return chat.title?.toLowerCase().includes(q);
    }
    return true;
  });

  const hasSelection = selectedIds.size > 0;

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

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Conversations</h1>
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
            placeholder="Search your conversations..."
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

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                clearSelection();
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

        {/* Selection info bar */}
        {hasSelection && (
          <div className={styles.selectionBar}>
            <span className={styles.selectionCount}>{selectedIds.size} selected</span>
            <button
              className={styles.selectionClose}
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Conversation list */}
        <div className={styles.list} ref={listRef}>
          {conversationsLoading && conversations.length === 0 ? (
            <div className={styles.skeleton}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.skeletonItem}>
                  <div className={styles.skeletonCheckbox} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonSub} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <>
              {filteredConversations.map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.item} ${
                    selectedIds.has(chat.id) ? styles.itemSelected : ''
                  } ${currentChatId === chat.id ? styles.itemCurrent : ''}`}
                >
                  <button
                    className={styles.itemCheckbox}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(chat.id);
                    }}
                    aria-label={selectedIds.has(chat.id) ? 'Deselect' : 'Select'}
                  >
                    <div
                      className={`${styles.checkbox} ${
                        selectedIds.has(chat.id) ? styles.checkboxChecked : ''
                      }`}
                    >
                      {selectedIds.has(chat.id) && (
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
                  </button>
                  <button className={styles.itemContent} onClick={() => handleChatClick(chat.id)}>
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>{chat.title || 'Untitled'}</span>
                      {starredIds.has(chat.id) && (
                        <span className={styles.itemStar}>
                          <StarIcon filled />
                        </span>
                      )}
                    </div>
                    <span className={styles.itemDate}>
                      {formatDate(chat.updatedAt || chat.createdAt)}
                    </span>
                  </button>
                </div>
              ))}
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className={styles.sentinel}>
                {conversationsLoading && <div className={styles.loadingMore}>Loading more...</div>}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <ChatIcon />
              </div>
              <h3 className={styles.emptyTitle}>
                {activeTab === 'starred'
                  ? 'No starred conversations'
                  : activeTab === 'archived'
                  ? 'No archived conversations'
                  : searchQuery
                  ? 'No results found'
                  : 'No conversations yet'}
              </h3>
              <p className={styles.emptyDesc}>
                {activeTab === 'starred'
                  ? 'Star conversations from the menu to find them quickly here.'
                  : activeTab === 'archived'
                  ? 'Archived conversations will appear here.'
                  : searchQuery
                  ? 'Try a different search term.'
                  : 'Start a new chat to begin a conversation.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating action bar */}
      {hasSelection && (
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

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>
              Delete {selectedIds.size} conversation{selectedIds.size > 1 ? 's' : ''}?
            </h3>
            <p className={styles.confirmDesc}>
              This will permanently delete the selected conversation
              {selectedIds.size > 1 ? 's' : ''} and all messages. This cannot be undone.
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
    </div>
  );
}
