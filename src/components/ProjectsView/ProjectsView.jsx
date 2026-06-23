import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useScrollRestoration from '../../hooks/useScrollRestoration';
import {
  selectProjects,
  selectProjectsLoading,
  setProjects,
  addProject,
  updateProject as updateProjectInStore,
  removeProject,
  setProjectsLoading,
} from '../../store/slices/projectsSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { showUpgradeModal } from '../../store/slices/subscriptionSlice';
import { GuestGate } from '../GuestGate';
import { getProjectLimit, getNextTier } from '../../config/subscription';
import { selectCurrentTier } from '../../store/slices/subscriptionSlice';
import {
  createNewChat,
  setInputValue,
  setPendingAutoSubmit,
  setActiveProjectId,
} from '../../store/slices/chatSlice';
import { setPendingAttachments } from '../../utils/pendingAttachments';
import useFileDrop from '../../hooks/useFileDrop';
import usePasteImages from '../../hooks/usePasteImages';
import DropOverlay from '../DropOverlay';
import {
  fetchProjects,
  createProject as createProjectApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  fetchConversations,
  updateConversation,
} from '../../services/api';
import useDeleteConversation from '../../hooks/useDeleteConversation';
import {
  SearchIcon,
  PlusIcon,
  CloseIcon,
  ProjectsIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  StarIcon,
  ArchiveIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChatIcon,
  FileTextIcon,
  FilePlusIcon,
  CheckIcon,
  SendIcon,
  CloudIcon,
  CameraIcon,
  GlobeIcon,
  BookIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import ModalityBar from '../ModalityBar/ModalityBar';
import styles from './ProjectsView.module.css';
import MarkdownTextarea from '../MarkdownTextarea/MarkdownTextarea';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { id: 'activity', label: 'Recent activity' },
  { id: 'edited', label: 'Last edited' },
  { id: 'created', label: 'Date created' },
  { id: 'name', label: 'Name' },
];

const VALID_FILTERS = new Set(FILTER_TABS.map((t) => t.id));
const VALID_SORTS = new Set(SORT_OPTIONS.map((s) => s.id));
const DEFAULT_FILTER = 'all';
const DEFAULT_SORT = 'activity';
const SEARCH_DEBOUNCE_MS = 250;

function formatRelativeTime(dateStr) {
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortProjects(projects, sortBy) {
  const sorted = [...projects];
  switch (sortBy) {
    case 'activity':
      return sorted.sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
    case 'edited':
      return sorted.sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
    case 'created':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    default:
      return sorted;
  }
}

// ─── Project Form Modal ──────────────────────────────────────────────────────

function ProjectFormModal({ project, onClose, onSubmit }) {
  const isEditing = !!project;
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [instructions, setInstructions] = useState(project?.instructions || '');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
      });
      onClose();
    } catch {
      // Allow retry
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditing ? 'Edit project' : 'Create a project'}</h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Project name</label>
            <input
              ref={nameRef}
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Campaign, Product Launch"
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Description <span className={styles.formHint}>(optional)</span>
            </label>
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this project is about..."
              maxLength={500}
              rows={2}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Instructions{' '}
              <span className={styles.formHint}>(used as context for conversations)</span>
            </label>
            <textarea
              className={`${styles.formTextarea} ${styles.instructionsTextarea}`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add custom instructions that will be included as context in every conversation within this project..."
              maxLength={4000}
              rows={5}
            />
            <div className={styles.formCharCount}>{instructions.length} / 4000</div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.modalSubmitBtn}
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Project Workspace View ──────────────────────────────────────────────────

function ProjectWorkspace({ project, onBack, onEdit, onDelete, onToggleStar, onToggleArchive }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [convMenuOpen, setConvMenuOpen] = useState(null);
  const [convDeleteConfirm, setConvDeleteConfirm] = useState(null);
  const deleteConversation = useDeleteConversation();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const textareaRef = useRef(null);
  const moreRef = useRef(null);
  const convMenuRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations for this project
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setConvsLoading(true);
      try {
        const data = await fetchConversations(100, 0, { projectId: project.id });
        if (!cancelled) setConversations(data.conversations || []);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setConvsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [chatInput]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false);
      }
      if (convMenuRef.current && !convMenuRef.current.contains(e.target)) {
        setConvMenuOpen(null);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text && attachedFiles.length === 0) return;
    setPendingAttachments(attachedFiles);
    dispatch(createNewChat());
    dispatch(setActiveProjectId(project.id));
    dispatch(setInputValue(text));
    dispatch(setPendingAutoSubmit(true));
    navigate('/');
  };

  const handleAttachFiles = useCallback((incoming) => {
    if (!incoming || incoming.length === 0) return;
    setAttachedFiles((prev) => [...prev, ...incoming]);
  }, []);

  const dropTargetRef = useRef(null);
  const { isDragging } = useFileDrop(dropTargetRef, {
    onFiles: handleAttachFiles,
    enabled: true,
  });
  usePasteImages({ onFiles: handleAttachFiles, enabled: true });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleConvClick = (conv) => {
    navigate(`/conversations/${conv.id}`);
  };

  const descriptionText = project.description || '';
  const instructionsText = project.instructions || '';
  const instructionsPreview =
    instructionsText.length > 120 && !instructionsExpanded
      ? instructionsText.slice(0, 120) + '...'
      : instructionsText;

  return (
    <>
      <div className={styles.workspacePage} ref={dropTargetRef}>
        <DropOverlay visible={isDragging} />
        {/* Back nav */}
        <div className={styles.workspaceTopBar}>
          <button className={styles.detailBack} onClick={onBack}>
            <ChevronLeftIcon />
            <span>All projects</span>
          </button>
        </div>

        <div className={styles.workspaceLayout}>
          {/* ── Main Column ── */}
          <div className={styles.workspaceMain}>
            {/* Project header */}
            <div className={styles.wsHeader}>
              <div className={styles.wsHeaderTop}>
                <div className={styles.wsHeaderIcon}>
                  <ProjectsIcon />
                </div>
                <div className={styles.wsHeaderActions} ref={moreRef}>
                  <button
                    className={styles.wsHeaderActionBtn}
                    onClick={() => onToggleStar(project)}
                    title={project.is_starred ? 'Unstar' : 'Star'}
                  >
                    <StarIcon filled={project.is_starred} />
                  </button>
                  <button
                    className={styles.wsHeaderActionBtn}
                    onClick={() => setShowMore(!showMore)}
                    title="More options"
                  >
                    <MoreVerticalIcon />
                  </button>

                  {showMore && (
                    <div className={styles.wsMoreDropdown}>
                      <button
                        className={styles.cardDropdownItem}
                        onClick={() => {
                          onEdit(project);
                          setShowMore(false);
                        }}
                      >
                        <EditIcon />
                        <span>Edit details</span>
                      </button>
                      <button
                        className={styles.cardDropdownItem}
                        onClick={() => {
                          onToggleArchive(project);
                          setShowMore(false);
                        }}
                      >
                        <ArchiveIcon />
                        <span>{project.is_archived ? 'Unarchive' : 'Archive'}</span>
                      </button>
                      <div className={styles.cardDropdownDivider} />
                      <button
                        className={`${styles.cardDropdownItem} ${styles.cardDropdownItemDanger}`}
                        onClick={() => {
                          onDelete(project);
                          setShowMore(false);
                        }}
                      >
                        <TrashIcon />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h1 className={styles.wsTitle}>{project.name}</h1>

              {descriptionText && <p className={styles.wsDescription}>{descriptionText}</p>}
            </div>

            {/* Chat input */}
            <form className={styles.wsChatBox} onSubmit={handleSendMessage}>
              <div className={styles.wsChatInputWrap}>
                {attachedFiles.length > 0 && (
                  <div className={styles.wsAttachedFiles}>
                    {attachedFiles.map((file, i) => (
                      <div key={i} className={styles.wsAttachedFile}>
                        <FileTextIcon />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          className={styles.wsAttachedFileRemove}
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                          aria-label="Remove file"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <MarkdownTextarea
                  ref={textareaRef}
                  className={styles.wsChatInput}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything about ${project.name}...`}
                  rows={1}
                  aria-label={`Project ${project.name} input`}
                />
                <div className={styles.wsChatActions}>
                  <div className={styles.wsChatLeft}>
                    <div className={styles.wsPlusWrap} ref={plusMenuRef}>
                      <button
                        type="button"
                        className={`${styles.wsPlusBtn} ${
                          showPlusMenu ? styles.wsPlusBtnActive : ''
                        }`}
                        onClick={() => setShowPlusMenu(!showPlusMenu)}
                        aria-label="Add content"
                      >
                        <PlusIcon />
                      </button>
                      {showPlusMenu && (
                        <div className={styles.wsPlusDropdown}>
                          <button
                            type="button"
                            className={styles.wsPlusDropdownItem}
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowPlusMenu(false);
                            }}
                          >
                            <FilePlusIcon />
                            <span>Upload files or images</span>
                          </button>
                          <button
                            type="button"
                            className={styles.wsPlusDropdownItem}
                            onClick={() => setShowPlusMenu(false)}
                          >
                            <CloudIcon />
                            <span>Add files from cloud</span>
                          </button>
                          <button
                            type="button"
                            className={styles.wsPlusDropdownItem}
                            onClick={() => setShowPlusMenu(false)}
                          >
                            <CameraIcon />
                            <span>Take a screenshot</span>
                          </button>
                          <button
                            type="button"
                            className={styles.wsPlusDropdownItem}
                            onClick={() => setShowPlusMenu(false)}
                          >
                            <GlobeIcon />
                            <span>Web Search</span>
                          </button>
                          <button
                            type="button"
                            className={styles.wsPlusDropdownItem}
                            onClick={() => setShowPlusMenu(false)}
                          >
                            <BookIcon />
                            <span>Research</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) setAttachedFiles((prev) => [...prev, ...files]);
                        e.target.value = '';
                      }}
                    />
                    <ModalityBar compact />
                  </div>
                  <div className={styles.wsChatRight}>
                    <ModelSelector />
                    <button
                      type="submit"
                      className={`${styles.wsChatSend} ${
                        chatInput.trim() || attachedFiles.length > 0 ? styles.wsChatSendActive : ''
                      }`}
                      disabled={!chatInput.trim() && attachedFiles.length === 0}
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Conversations list */}
            <div className={styles.wsConversations}>
              <div className={styles.wsConvHeader}>
                <span>Conversations</span>
                <span className={styles.wsConvCount}>{conversations.length}</span>
              </div>

              {convsLoading ? (
                <div className={styles.wsConvLoading}>
                  <div className={styles.wsConvSkeleton} />
                  <div className={styles.wsConvSkeleton} />
                  <div className={styles.wsConvSkeleton} />
                </div>
              ) : conversations.length > 0 ? (
                <div className={styles.wsConvList}>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={styles.wsConvItem}
                      onClick={() => handleConvClick(conv)}
                    >
                      <div className={styles.wsConvItemBody}>
                        <span className={styles.wsConvItemTitle}>{conv.title || 'Untitled'}</span>
                        <span className={styles.wsConvItemTime}>
                          Last message {formatRelativeTime(conv.updated_at || conv.created_at)}
                        </span>
                      </div>
                      <div
                        className={styles.wsConvItemActions}
                        ref={convMenuOpen === conv.id ? convMenuRef : null}
                      >
                        <button
                          className={`${styles.wsConvItemMenuBtn} ${
                            convMenuOpen === conv.id ? styles.wsConvItemMenuBtnActive : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConvMenuOpen(convMenuOpen === conv.id ? null : conv.id);
                          }}
                          aria-label="Conversation options"
                        >
                          <MoreVerticalIcon />
                        </button>
                        {convMenuOpen === conv.id && (
                          <div className={styles.wsConvItemDropdown}>
                            <button
                              className={styles.cardDropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvClick(conv);
                                setConvMenuOpen(null);
                              }}
                            >
                              <ChatIcon />
                              <span>Open chat</span>
                            </button>
                            <div className={styles.cardDropdownDivider} />
                            <button
                              className={`${styles.cardDropdownItem} ${styles.cardDropdownItemDanger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConvMenuOpen(null);
                                updateConversation(conv.id, { project_id: null }).then(() => {
                                  setConversations((prev) => prev.filter((c) => c.id !== conv.id));
                                });
                              }}
                            >
                              <CloseIcon />
                              <span>Remove from project</span>
                            </button>
                            <button
                              className={`${styles.cardDropdownItem} ${styles.cardDropdownItemDanger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConvMenuOpen(null);
                                setConvDeleteConfirm(conv);
                              }}
                            >
                              <TrashIcon />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.wsConvEmpty}>
                  <p>No conversations yet. Use the chat above to start one.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div className={styles.workspaceSide}>
            {/* Instructions card */}
            <div className={styles.wsSideCard}>
              <div className={styles.wsSideCardHeader}>
                <div className={styles.wsSideCardTitle}>
                  <FileTextIcon />
                  <span>Instructions</span>
                </div>
                <button
                  className={styles.wsSideCardAction}
                  onClick={() => onEdit(project)}
                  title="Edit instructions"
                >
                  <EditIcon />
                </button>
              </div>
              {instructionsText ? (
                <div className={styles.wsSideCardBody}>
                  <p className={styles.wsInstructionsText}>{instructionsPreview}</p>
                  {instructionsText.length > 120 && (
                    <button
                      className={styles.wsShowMoreBtn}
                      onClick={() => setInstructionsExpanded(!instructionsExpanded)}
                    >
                      {instructionsExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.wsSideCardEmpty}>
                  <p>Add instructions to tailor responses for this project.</p>
                  <button className={styles.wsSideCardEmptyAction} onClick={() => onEdit(project)}>
                    <PlusIcon />
                    <span>Add instructions</span>
                  </button>
                </div>
              )}
            </div>

            {/* Project info card */}
            <div className={styles.wsSideCard}>
              <div className={styles.wsSideCardHeader}>
                <div className={styles.wsSideCardTitle}>
                  <ProjectsIcon />
                  <span>Project info</span>
                </div>
              </div>
              <div className={styles.wsSideInfoList}>
                <div className={styles.wsSideInfoRow}>
                  <span className={styles.wsSideInfoLabel}>Created</span>
                  <span className={styles.wsSideInfoValue}>
                    {formatFullDate(project.created_at)}
                  </span>
                </div>
                {project.updated_at && project.updated_at !== project.created_at && (
                  <div className={styles.wsSideInfoRow}>
                    <span className={styles.wsSideInfoLabel}>Updated</span>
                    <span className={styles.wsSideInfoValue}>
                      {formatRelativeTime(project.updated_at)}
                    </span>
                  </div>
                )}
                <div className={styles.wsSideInfoRow}>
                  <span className={styles.wsSideInfoLabel}>Conversations</span>
                  <span className={styles.wsSideInfoValue}>{conversations.length}</span>
                </div>
                {project.is_starred && (
                  <div className={styles.wsSideInfoRow}>
                    <span className={styles.wsSideInfoLabel}>Starred</span>
                    <span className={styles.wsSideInfoStarred}>
                      <StarIcon filled />
                    </span>
                  </div>
                )}
                {project.is_archived && (
                  <div className={styles.wsSideInfoRow}>
                    <span className={styles.wsSideInfoLabel}>Status</span>
                    <span className={styles.wsSideInfoBadge}>Archived</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {convDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setConvDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>
              Delete &ldquo;{convDeleteConfirm.title || 'this conversation'}&rdquo;?
            </h3>
            <p className={styles.confirmDesc}>
              This will permanently delete the conversation and all its messages. This action cannot
              be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setConvDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={async () => {
                  const convId = convDeleteConfirm.id;
                  setConvDeleteConfirm(null);
                  setConversations((prev) => prev.filter((c) => c.id !== convId));
                  const ok = await deleteConversation(convId);
                  if (!ok) {
                    try {
                      const data = await fetchConversations(100, 0, {
                        projectId: project.id,
                      });
                      setConversations(data.conversations || []);
                    } catch {
                      /* hook already toasted */
                    }
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main ProjectsView ───────────────────────────────────────────────────────

export default function ProjectsView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeProjectId } = useParams();
  const projects = useSelector(selectProjects);
  const loading = useSelector(selectProjectsLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentTier = useSelector(selectCurrentTier);
  const pageRef = useRef(null);
  useScrollRestoration(pageRef);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const sortParam = searchParams.get('sort');
  const filter = filterParam && VALID_FILTERS.has(filterParam) ? filterParam : DEFAULT_FILTER;
  const sortBy = sortParam && VALID_SORTS.has(sortParam) ? sortParam : DEFAULT_SORT;

  const updateParam = useCallback(
    (name, value, defaultValue) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (!value || value === defaultValue) params.delete(name);
          else params.set(name, value);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setFilter = useCallback(
    (next) => updateParam('filter', next, DEFAULT_FILTER),
    [updateParam]
  );
  const setSortBy = useCallback((next) => updateParam('sort', next, DEFAULT_SORT), [updateParam]);

  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateParam('q', search.trim(), '');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search, updateParam]);

  const [sortOpen, setSortOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteOption, setDeleteOption] = useState('project-only');
  const sortRef = useRef(null);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load projects
  const loadProjects = useCallback(async () => {
    dispatch(setProjectsLoading(true));
    try {
      const data = await fetchProjects();
      dispatch(setProjects(data.projects || data || []));
    } catch {
      // Silently fail
    } finally {
      dispatch(setProjectsLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [loadProjects, isAuthenticated]);

  // Derive the currently-open project from the URL param.
  // Single source of truth: URL + Redux `projects`. No drifting local cache.
  const selectedProject = routeProjectId
    ? projects.find((p) => p.id === routeProjectId) ?? null
    : null;

  // If the URL references a project that doesn't exist (deleted or stale link)
  // after projects have loaded, redirect back to the list.
  useEffect(() => {
    if (routeProjectId && !loading && projects.length > 0 && !selectedProject) {
      navigate('/projects', { replace: true });
    }
  }, [routeProjectId, loading, projects.length, selectedProject, navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setMenuOpenId(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSortOpen(false);
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter
    if (filter === 'starred') {
      result = result.filter((p) => p.is_starred);
    } else if (filter === 'archived') {
      result = result.filter((p) => p.is_archived);
    } else {
      result = result.filter((p) => !p.is_archived);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    return sortProjects(result, sortBy);
  }, [projects, filter, search, sortBy]);

  // Counts for tabs
  const counts = useMemo(() => {
    const all = projects.filter((p) => !p.is_archived).length;
    const starred = projects.filter((p) => p.is_starred).length;
    const archived = projects.filter((p) => p.is_archived).length;
    return { all, starred, archived };
  }, [projects]);

  // Handlers
  const handleCreate = async (data) => {
    const limit = getProjectLimit(currentTier);
    const activeProjects = projects.filter((p) => !p.is_archived).length;

    if (activeProjects >= limit) {
      const suggestedTier = getNextTier(currentTier);
      dispatch(
        showUpgradeModal({
          reason: 'feature_gated',
          suggestedTier,
          message: `You've reached the limit of ${limit} project${limit === 1 ? '' : 's'} on the ${
            currentTier.charAt(0).toUpperCase() + currentTier.slice(1)
          } plan.`,
        })
      );
      return;
    }

    const result = await createProjectApi(data);
    const newProject = result.project || result;
    dispatch(addProject(newProject));
    if (newProject?.id) {
      navigate(`/projects/${newProject.id}`);
    }
  };

  const handleEdit = async (data) => {
    if (!editingProject) return;
    const result = await updateProjectApi(editingProject.id, data);
    const updated = result.project || result;
    dispatch(updateProjectInStore({ id: editingProject.id, updates: updated }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const wasSelected = selectedProject?.id === deleteConfirm.id;
    try {
      await deleteProjectApi(deleteConfirm.id, {
        deleteConversations: deleteOption === 'everything',
      });
      dispatch(removeProject(deleteConfirm.id));
      if (wasSelected) {
        navigate('/projects');
      }
    } catch {
      // Silently fail
    }
    setDeleteConfirm(null);
    setDeleteOption('project-only');
  };

  const handleToggleStar = async (project) => {
    const newVal = !project.is_starred;
    dispatch(updateProjectInStore({ id: project.id, updates: { is_starred: newVal } }));
    try {
      await updateProjectApi(project.id, { is_starred: newVal });
    } catch {
      dispatch(updateProjectInStore({ id: project.id, updates: { is_starred: !newVal } }));
    }
  };

  const handleToggleArchive = async (project) => {
    const newVal = !project.is_archived;
    dispatch(updateProjectInStore({ id: project.id, updates: { is_archived: newVal } }));
    setMenuOpenId(null);
    try {
      await updateProjectApi(project.id, { is_archived: newVal });
    } catch {
      dispatch(updateProjectInStore({ id: project.id, updates: { is_archived: !newVal } }));
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setShowModal(true);
    setMenuOpenId(null);
  };

  const openDeleteConfirm = (project) => {
    setDeleteConfirm(project);
    setDeleteOption('project-only');
    setMenuOpenId(null);
  };

  const handleCardClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  // If viewing a project workspace
  if (selectedProject) {
    return (
      <>
        <ProjectWorkspace
          project={selectedProject}
          onBack={() => navigate('/projects')}
          onEdit={(p) => openEditModal(p)}
          onDelete={(p) => openDeleteConfirm(p)}
          onToggleStar={handleToggleStar}
          onToggleArchive={handleToggleArchive}
        />

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <TrashIcon />
              </div>
              <h3 className={styles.confirmTitle}>Delete &ldquo;{deleteConfirm.name}&rdquo;?</h3>
              <p className={styles.confirmDesc}>
                Choose what to remove. This action cannot be undone.
              </p>
              <div className={styles.deleteOptions}>
                <button
                  type="button"
                  className={`${styles.deleteOption} ${
                    deleteOption === 'project-only' ? styles.deleteOptionSelected : ''
                  }`}
                  onClick={() => setDeleteOption('project-only')}
                >
                  <div className={styles.deleteOptionRadio}>
                    {deleteOption === 'project-only' && (
                      <div className={styles.deleteOptionRadioDot} />
                    )}
                  </div>
                  <div className={styles.deleteOptionContent}>
                    <span className={styles.deleteOptionLabel}>Delete project only</span>
                    <span className={styles.deleteOptionHint}>
                      Your conversations will be kept and unlinked from this project
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.deleteOption} ${
                    deleteOption === 'everything' ? styles.deleteOptionSelected : ''
                  } ${deleteOption === 'everything' ? styles.deleteOptionDanger : ''}`}
                  onClick={() => setDeleteOption('everything')}
                >
                  <div className={styles.deleteOptionRadio}>
                    {deleteOption === 'everything' && (
                      <div className={styles.deleteOptionRadioDot} />
                    )}
                  </div>
                  <div className={styles.deleteOptionContent}>
                    <span className={styles.deleteOptionLabel}>
                      Delete project and all conversations
                    </span>
                    <span className={styles.deleteOptionHint}>
                      Permanently removes the project and every conversation in it
                    </span>
                  </div>
                </button>
              </div>
              <div className={styles.confirmActions}>
                <button className={styles.confirmCancelBtn} onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                  Delete{deleteOption === 'everything' ? ' everything' : ' project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {showModal && (
          <ProjectFormModal
            project={editingProject}
            onClose={() => {
              setShowModal(false);
              setEditingProject(null);
            }}
            onSubmit={editingProject ? handleEdit : handleCreate}
          />
        )}
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <div ref={pageRef} className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Projects</h1>
              <p className={styles.subtitle}>Organise your conversations with custom context</p>
            </div>
          </div>
          <GuestGate
            icon={<ProjectsIcon />}
            title="Organise with Projects"
            description="Sign in to create projects, group conversations, and add custom context to your chats."
            actionLabel="Sign in to use Projects"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>Organise your conversations with custom context</p>
          </div>
          <button
            className={styles.newProjectBtn}
            onClick={() => {
              setEditingProject(null);
              setShowModal(true);
            }}
          >
            <PlusIcon />
            <span>New project</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className={styles.searchFilterBar}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchIcon}>
              <SearchIcon />
            </div>
            <input
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <CloseIcon />
              </button>
            )}
            {!search && (
              <div className={styles.searchWebIcon} title="Web search">
                <GlobeIcon />
              </div>
            )}
          </div>

          <div className={styles.sortWrapper} ref={sortRef}>
            <button className={styles.sortBtn} onClick={() => setSortOpen(!sortOpen)}>
              <span>Sort by</span>
              <ChevronDownIcon />
            </button>
            {sortOpen && (
              <div className={styles.sortDropdown}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.sortOption} ${
                      sortBy === opt.id ? styles.sortOptionActive : ''
                    }`}
                    onClick={() => {
                      setSortBy(opt.id);
                      setSortOpen(false);
                    }}
                  >
                    <span className={styles.sortCheck}>{sortBy === opt.id && <CheckIcon />}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.filterTab} ${filter === tab.id ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className={styles.filterTabBadge}>{counts[tab.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && projects.length === 0 ? (
          <div className={styles.skeleton}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonIcon} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonDesc} />
                <div className={styles.skeletonFooter} />
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className={styles.grid}>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`${styles.card} ${project.is_starred ? styles.cardStarred : ''} ${
                  menuOpenId === project.id ? styles.cardMenuOpen : ''
                }`}
                onClick={() => handleCardClick(project)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <ProjectsIcon />
                  </div>
                  <button
                    ref={menuOpenId === project.id ? menuRef : null}
                    className={`${styles.cardMenu} ${
                      menuOpenId === project.id ? styles.cardMenuVisible : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === project.id ? null : project.id));
                    }}
                  >
                    <MoreVerticalIcon />
                  </button>
                </div>

                <div className={styles.cardName}>{project.name}</div>
                <div className={styles.cardDesc}>{project.description || 'No description'}</div>

                <div className={styles.cardFooter}>
                  <span className={styles.cardTime}>
                    Updated {formatRelativeTime(project.updated_at || project.created_at)}
                  </span>
                  <div className={styles.cardBadges}>
                    {project.is_starred && (
                      <span className={styles.cardStarBadge}>
                        <StarIcon filled />
                      </span>
                    )}
                    {project.instructions && (
                      <span className={styles.cardInstructionsBadge}>
                        <FileTextIcon />
                        <span>Instructions</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card dropdown */}
                {menuOpenId === project.id && (
                  <div className={styles.cardDropdown} ref={dropdownRef}>
                    <button
                      className={styles.cardDropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(project);
                        setMenuOpenId(null);
                      }}
                    >
                      <StarIcon filled={project.is_starred} />
                      <span>{project.is_starred ? 'Unstar' : 'Star'}</span>
                    </button>
                    <button
                      className={styles.cardDropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                    >
                      <EditIcon />
                      <span>Edit details</span>
                    </button>
                    <button
                      className={styles.cardDropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArchive(project);
                      }}
                    >
                      <ArchiveIcon />
                      <span>{project.is_archived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    <div className={styles.cardDropdownDivider} />
                    <button
                      className={`${styles.cardDropdownItem} ${styles.cardDropdownItemDanger}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(project);
                      }}
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyVisual}>
              <ProjectsIcon />
            </div>
            <h3 className={styles.emptyTitle}>
              {search
                ? 'No projects found'
                : filter === 'starred'
                ? 'No starred projects'
                : filter === 'archived'
                ? 'No archived projects'
                : 'No projects yet'}
            </h3>
            <p className={styles.emptyDesc}>
              {search
                ? `No projects match "${search}". Try a different search term.`
                : filter === 'starred'
                ? 'Star your important projects to find them quickly here.'
                : filter === 'archived'
                ? 'Archived projects will appear here.'
                : 'Create your first project to organise conversations with custom instructions and context.'}
            </p>
            {!search && filter === 'all' && (
              <button
                className={styles.emptyAction}
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
              >
                <PlusIcon />
                <span>Create a project</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSubmit={editingProject ? handleEdit : handleCreate}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>Delete &ldquo;{deleteConfirm.name}&rdquo;?</h3>
            <p className={styles.confirmDesc}>
              Choose what to remove. This action cannot be undone.
            </p>
            <div className={styles.deleteOptions}>
              <button
                type="button"
                className={`${styles.deleteOption} ${
                  deleteOption === 'project-only' ? styles.deleteOptionSelected : ''
                }`}
                onClick={() => setDeleteOption('project-only')}
              >
                <div className={styles.deleteOptionRadio}>
                  {deleteOption === 'project-only' && (
                    <div className={styles.deleteOptionRadioDot} />
                  )}
                </div>
                <div className={styles.deleteOptionContent}>
                  <span className={styles.deleteOptionLabel}>Delete project only</span>
                  <span className={styles.deleteOptionHint}>
                    Your conversations will be kept and unlinked from this project
                  </span>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.deleteOption} ${
                  deleteOption === 'everything' ? styles.deleteOptionSelected : ''
                } ${deleteOption === 'everything' ? styles.deleteOptionDanger : ''}`}
                onClick={() => setDeleteOption('everything')}
              >
                <div className={styles.deleteOptionRadio}>
                  {deleteOption === 'everything' && <div className={styles.deleteOptionRadioDot} />}
                </div>
                <div className={styles.deleteOptionContent}>
                  <span className={styles.deleteOptionLabel}>
                    Delete project and all conversations
                  </span>
                  <span className={styles.deleteOptionHint}>
                    Permanently removes the project and every conversation in it
                  </span>
                </div>
              </button>
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                Delete{deleteOption === 'everything' ? ' everything' : ' project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
