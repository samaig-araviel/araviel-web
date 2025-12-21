import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { renameProject } from '../../store/projectSlice';
import { closeModal } from '../../store/uiSlice';
import Modal from './Modal';
import styles from './Modal.module.css';

const RenameProjectModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeModal } = useAppSelector((state) => state.ui);
  const { projects } = useAppSelector((state) => state.project);

  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = activeModal?.type === 'renameProject';
  const projectId = activeModal?.data?.projectId;
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, project]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    dispatch(renameProject({
      id: projectId,
      name: name.trim(),
    }));

    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rename Project" size="sm">
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="rename-project">
            Project Name
          </label>
          <input
            ref={inputRef}
            id="rename-project"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
            required
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={!name.trim()}
          >
            Rename
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RenameProjectModal;
