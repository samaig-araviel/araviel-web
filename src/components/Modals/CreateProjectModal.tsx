import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addProject } from '../../store/projectSlice';
import { closeModal } from '../../store/uiSlice';
import { DEFAULT_CATEGORIES } from '../../types';
import Modal from './Modal';
import styles from './Modal.module.css';

const CreateProjectModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeModal } = useAppSelector((state) => state.ui);
  const { customCategories } = useAppSelector((state) => state.project);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = activeModal?.type === 'createProject';
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setCategory('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    dispatch(addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
    }));

    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project" size="md">
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project-name">
            Project Name
          </label>
          <input
            ref={inputRef}
            id="project-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project-description">
            Description (optional)
          </label>
          <textarea
            id="project-description"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this project is about..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="project-category">
            Category (optional)
          </label>
          <select
            id="project-category"
            className={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category</option>
            {allCategories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
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
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
