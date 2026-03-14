import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectProjects, addProject } from '../../store/slices/projectsSlice';
import { createProject as createProjectApi } from '../../services/api';
import { ProjectsIcon, PlusIcon, ChevronLeftIcon, ChevronDownIcon, SearchIcon } from '../Icons';
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const nameRef = useRef(null);
  const searchRef = useRef(null);
  const comboRef = useRef(null);

  const activeProjects = projects.filter((p) => !p.is_archived);
  const filteredProjects = search.trim()
    ? activeProjects.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : activeProjects;

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIdx(-1);
  }, [search]);

  useEffect(() => {
    if (creating && nameRef.current) {
      nameRef.current.focus();
    }
  }, [creating]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (open) {
          setOpen(false);
          setSearch('');
        } else if (creating) {
          setCreating(false);
          setName('');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [creating, open, onClose]);

  // Keyboard navigation within dropdown
  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, filteredProjects.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && highlightIdx >= 0 && highlightIdx < filteredProjects.length) {
        e.preventDefault();
        onSelect(filteredProjects[highlightIdx].id);
      }
    },
    [filteredProjects, highlightIdx, onSelect]
  );

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

            {/* Combobox dropdown */}
            <div className={styles.comboWrap} ref={comboRef}>
              <button
                className={`${styles.comboTrigger} ${open ? styles.comboTriggerOpen : ''}`}
                onClick={() => setOpen(!open)}
                type="button"
              >
                <ProjectsIcon />
                <span className={styles.comboTriggerText}>Select a project</span>
                <ChevronDownIcon />
              </button>

              {open && (
                <div className={styles.comboDropdown}>
                  <div className={styles.comboSearchWrap}>
                    <SearchIcon />
                    <input
                      ref={searchRef}
                      className={styles.comboSearchInput}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search projects..."
                      autoComplete="off"
                    />
                  </div>

                  <div className={styles.comboList}>
                    {filteredProjects.map((project, idx) => (
                      <button
                        key={project.id}
                        className={`${styles.comboItem} ${
                          idx === highlightIdx ? styles.comboItemHighlight : ''
                        }`}
                        onClick={() => onSelect(project.id)}
                        onMouseEnter={() => setHighlightIdx(idx)}
                      >
                        <ProjectsIcon />
                        <span>{project.name}</span>
                      </button>
                    ))}
                    {filteredProjects.length === 0 && (
                      <p className={styles.comboEmpty}>
                        {search.trim() ? `No projects match "${search.trim()}"` : 'No projects yet'}
                      </p>
                    )}
                  </div>

                  {!search.trim() && (
                    <>
                      <div className={styles.comboDivider} />
                      <button
                        className={styles.comboCreate}
                        onClick={() => {
                          setOpen(false);
                          setSearch('');
                          setCreating(true);
                        }}
                      >
                        <PlusIcon />
                        <span>New project</span>
                      </button>
                    </>
                  )}
                </div>
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
