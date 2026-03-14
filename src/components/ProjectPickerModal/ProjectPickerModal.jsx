import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectProjects, addProject } from '../../store/slices/projectsSlice';
import { createProject as createProjectApi } from '../../services/api';
import { ProjectsIcon, PlusIcon, ChevronLeftIcon, SearchIcon } from '../Icons';
import styles from './ProjectPickerModal.module.css';

/**
 * A reusable modal for picking (or creating) a project and assigning a conversation to it.
 *
 * @param {object}   props
 * @param {function} props.onSelect  - Called with the selected project ID
 * @param {function} props.onClose   - Called when the modal is dismissed
 * @param {function} props.onError   - Called with an error message string
 */
export default function ProjectPickerModal({ onSelect, onClose, onError }) {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const nameRef = useRef(null);
  const searchRef = useRef(null);

  const activeProjects = projects.filter((p) => !p.is_archived);
  const filteredProjects = search.trim()
    ? activeProjects.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : activeProjects;

  useEffect(() => {
    if (creating && nameRef.current) {
      nameRef.current.focus();
    } else if (!creating && searchRef.current) {
      searchRef.current.focus();
    }
  }, [creating]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (creating) {
          setCreating(false);
          setName('');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [creating, onClose]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const data = await createProjectApi({ name: trimmed });
      const newProject = data.project || data;
      dispatch(addProject(newProject));
      onSelect(newProject.id);
    } catch {
      onError?.("Couldn't create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {!creating ? (
          <>
            <div className={styles.iconWrap}>
              <ProjectsIcon />
            </div>
            <h3 className={styles.title}>Move to project</h3>
            <p className={styles.desc}>Choose which project this conversation belongs to.</p>
            <div className={styles.searchWrap}>
              <SearchIcon />
              <input
                ref={searchRef}
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                autoComplete="off"
              />
            </div>
            <div className={styles.list}>
              {!search.trim() && (
                <>
                  <button className={styles.createBtn} onClick={() => setCreating(true)}>
                    <PlusIcon />
                    <span>New project</span>
                  </button>
                  {activeProjects.length > 0 && <div className={styles.divider} />}
                </>
              )}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  className={styles.item}
                  onClick={() => onSelect(project.id)}
                >
                  <ProjectsIcon />
                  <span>{project.name}</span>
                </button>
              ))}
              {filteredProjects.length === 0 && !search.trim() && (
                <p className={styles.empty}>No projects yet. Create one above.</p>
              )}
              {filteredProjects.length === 0 && search.trim() && (
                <p className={styles.empty}>No projects match "{search.trim()}"</p>
              )}
            </div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.iconWrap}>
              <ProjectsIcon />
            </div>
            <h3 className={styles.title}>Create new project</h3>
            <p className={styles.desc}>
              Give your project a name. You can add a description and instructions later.
            </p>
            <form className={styles.form} onSubmit={handleCreate}>
              <input
                ref={nameRef}
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing Campaign"
                maxLength={100}
                autoComplete="off"
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setCreating(false);
                    setName('');
                  }}
                >
                  <ChevronLeftIcon />
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={!name.trim() || submitting}
                >
                  {submitting ? 'Creating...' : 'Create & assign'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
