import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { deleteProject } from '../../store/projectSlice';
import { closeModal } from '../../store/uiSlice';
import Modal from './Modal';
import styles from './Modal.module.css';

const DeleteProjectModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeModal } = useAppSelector((state) => state.ui);
  const { projects } = useAppSelector((state) => state.project);

  const isOpen = activeModal?.type === 'deleteProject';
  const projectId = activeModal?.data?.projectId;
  const project = projects.find((p) => p.id === projectId);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleDelete = () => {
    if (projectId) {
      dispatch(deleteProject(projectId));
    }
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Project" size="sm">
      <p className={styles.warningText}>
        Are you sure you want to delete{' '}
        <span className={styles.warningHighlight}>"{project?.name}"</span>?
      </p>
      <p className={styles.warningText}>
        This action cannot be undone. All chats associated with this project will
        be moved to the general chats section.
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger}`}
          onClick={handleDelete}
        >
          Delete Project
        </button>
      </div>
    </Modal>
  );
};

export default DeleteProjectModal;
