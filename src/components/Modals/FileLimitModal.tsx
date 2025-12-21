import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeModal } from '../../store/uiSlice';
import { AlertCircleIcon } from '../Icons';
import Modal from './Modal';
import styles from './Modal.module.css';

const FileLimitModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeModal } = useAppSelector((state) => state.ui);

  const isOpen = activeModal?.type === 'fileLimit';

  const handleClose = () => {
    dispatch(closeModal());
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="File Limit Reached" size="sm">
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            background: 'var(--accent-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <AlertCircleIcon size={32} />
        </div>
        <p className={styles.warningText}>
          You can only attach up to{' '}
          <span className={styles.warningHighlight}>10 files</span> per message.
        </p>
        <p className={styles.warningText}>
          Please remove some files before adding more.
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleClose}
          style={{ width: '100%' }}
        >
          Got It
        </button>
      </div>
    </Modal>
  );
};

export default FileLimitModal;
