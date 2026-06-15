import styles from './DropOverlay.module.css';

export default function DropOverlay({ visible, label = 'Drop to attach' }) {
  if (!visible) return null;
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.card}>
        <svg
          className={styles.icon}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
