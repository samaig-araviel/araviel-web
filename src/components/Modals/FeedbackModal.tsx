import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeModal } from '../../store/uiSlice';
import Modal from './Modal';
import styles from './Modal.module.css';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'other', label: 'Other' },
];

const FeedbackModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeModal } = useAppSelector((state) => state.ui);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('improvement');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = activeModal?.type === 'feedback';

  useEffect(() => {
    if (isOpen) {
      setFeedbackType('improvement');
      setMessage('');
      setSubmitted(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Simulate feedback submission
    console.log('Feedback submitted:', {
      type: feedbackType,
      message: message.trim(),
      timestamp: Date.now(),
    });

    setSubmitted(true);

    // Close after showing success message
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Thank You!" size="sm">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              background: 'var(--success-light)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
              fontSize: 32,
            }}
          >
            ✓
          </div>
          <p className={styles.warningText}>
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Feedback" size="md">
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="feedback-type">
            Feedback Type
          </label>
          <select
            id="feedback-type"
            className={styles.input}
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
          >
            {FEEDBACK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="feedback-message">
            Your Feedback
          </label>
          <textarea
            ref={textareaRef}
            id="feedback-message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
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
            disabled={!message.trim()}
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;
