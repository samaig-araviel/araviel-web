import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectProjects,
  selectProjectsLoading,
  setProjects,
  addProject,
  updateProject as updateProjectInStore,
  removeProject,
  setProjectsLoading,
} from '../../store/slices/projectsSlice';
import {
  fetchProjects,
  createProject as createProjectApi,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
} from '../../services/api';
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
  CheckIcon,
} from '../Icons';
import styles from './ProjectsView.module.css';

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

// ─── Project Detail View ─────────────────────────────────────────────────────

function ProjectDetail({ project, onBack, onEdit, onDelete, onToggleStar, onToggleArchive }) {
  return (
    <div className={styles.detailView}>
      <button className={styles.detailBack} onClick={onBack}>
        <ChevronLeftIcon />
        <span>All projects</span>
      </button>

      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <div className={styles.detailIcon}>
            <ProjectsIcon />
          </div>
          <h1 className={styles.detailName}>{project.name}</h1>
        </div>
        <div className={styles.detailActions}>
          <button
            className={styles.detailActionBtn}
            onClick={() => onToggleStar(project)}
            title={project.is_starred ? 'Unstar' : 'Star'}
          >
            <StarIcon filled={project.is_starred} />
          </button>
          <button className={styles.detailActionBtn} onClick={() => onEdit(project)} title="Edit">
            <EditIcon />
          </button>
          <button
            className={`${styles.detailActionBtn} ${styles.detailActionBtnDanger}`}
            onClick={() => onDelete(project)}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className={styles.detailMeta}>
        <span>Created {formatFullDate(project.created_at)}</span>
        {project.updated_at && project.updated_at !== project.created_at && (
          <>
            <span className={styles.detailMetaDot} />
            <span>Updated {formatRelativeTime(project.updated_at)}</span>
          </>
        )}
        {project.is_archived && (
          <>
            <span className={styles.detailMetaDot} />
            <span>Archived</span>
          </>
        )}
      </div>

      {/* Description */}
      <div className={styles.detailSection}>
        <div className={styles.detailSectionHeader}>
          <h3 className={styles.detailSectionTitle}>Description</h3>
          <button className={styles.detailSectionEdit} onClick={() => onEdit(project)}>
            Edit
          </button>
        </div>
        <div
          className={`${styles.detailDesc} ${!project.description ? styles.detailDescEmpty : ''}`}
        >
          {project.description || 'No description added yet.'}
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.detailSection}>
        <div className={styles.detailSectionHeader}>
          <h3 className={styles.detailSectionTitle}>Instructions</h3>
          <button className={styles.detailSectionEdit} onClick={() => onEdit(project)}>
            Edit
          </button>
        </div>
        <div
          className={`${styles.detailInstructions} ${
            !project.instructions ? styles.detailInstructionsEmpty : ''
          }`}
        >
          {project.instructions ||
            'No custom instructions. Conversations in this project will use default context.'}
        </div>
      </div>

      <div className={styles.detailDivider} />

      {/* Conversations in project */}
      <div className={styles.detailSection}>
        <div className={styles.detailSectionHeader}>
          <h3 className={styles.detailSectionTitle}>Conversations</h3>
        </div>
        <div className={styles.detailConvEmpty}>
          No conversations in this project yet. Start a new chat and assign it to this project.
        </div>
      </div>
    </div>
  );
}

// ─── Main ProjectsView ───────────────────────────────────────────────────────

export default function ProjectsView() {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const loading = useSelector(selectProjectsLoading);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('activity');
  const [sortOpen, setSortOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const sortRef = useRef(null);
  const menuRef = useRef(null);

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
    loadProjects();
  }, [loadProjects]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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
    const result = await createProjectApi(data);
    const newProject = result.project || result;
    dispatch(addProject(newProject));
  };

  const handleEdit = async (data) => {
    if (!editingProject) return;
    const result = await updateProjectApi(editingProject.id, data);
    const updated = result.project || result;
    dispatch(updateProjectInStore({ id: editingProject.id, updates: updated }));
    // Update selectedProject if viewing it
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject({ ...selectedProject, ...updated });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProjectApi(deleteConfirm.id);
      dispatch(removeProject(deleteConfirm.id));
      if (selectedProject?.id === deleteConfirm.id) {
        setSelectedProject(null);
      }
    } catch {
      // Silently fail
    }
    setDeleteConfirm(null);
  };

  const handleToggleStar = async (project) => {
    const newVal = !project.is_starred;
    dispatch(updateProjectInStore({ id: project.id, updates: { is_starred: newVal } }));
    if (selectedProject?.id === project.id) {
      setSelectedProject({ ...selectedProject, is_starred: newVal });
    }
    try {
      await updateProjectApi(project.id, { is_starred: newVal });
    } catch {
      dispatch(updateProjectInStore({ id: project.id, updates: { is_starred: !newVal } }));
    }
  };

  const handleToggleArchive = async (project) => {
    const newVal = !project.is_archived;
    dispatch(updateProjectInStore({ id: project.id, updates: { is_archived: newVal } }));
    if (selectedProject?.id === project.id) {
      setSelectedProject({ ...selectedProject, is_archived: newVal });
    }
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
    setMenuOpenId(null);
  };

  const handleCardClick = (project) => {
    setSelectedProject(project);
  };

  // If viewing a project detail
  if (selectedProject) {
    // Find latest version from store
    const current = projects.find((p) => p.id === selectedProject.id) || selectedProject;
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <ProjectDetail
            project={current}
            onBack={() => setSelectedProject(null)}
            onEdit={(p) => openEditModal(p)}
            onDelete={(p) => openDeleteConfirm(p)}
            onToggleStar={handleToggleStar}
            onToggleArchive={handleToggleArchive}
          />
        </div>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <TrashIcon />
              </div>
              <h3 className={styles.confirmTitle}>Delete this project?</h3>
              <p className={styles.confirmDesc}>
                This will permanently delete &ldquo;{deleteConfirm.name}&rdquo; and remove it from
                all conversations. This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button className={styles.confirmCancelBtn} onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                  Delete
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
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
                className={`${styles.card} ${project.is_starred ? styles.cardStarred : ''}`}
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
                  <div className={styles.cardDropdown}>
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
            <h3 className={styles.confirmTitle}>Delete this project?</h3>
            <p className={styles.confirmDesc}>
              This will permanently delete &ldquo;{deleteConfirm.name}&rdquo; and remove it from all
              conversations. This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
