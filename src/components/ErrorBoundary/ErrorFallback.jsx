import styles from './ErrorFallback.module.css';

/**
 * Presentational component used by every error surface (root boundary, route
 * boundary, 404, 500). The caller chooses the layout variant with the
 * `variant` prop. All copy is plain-language and omits technical detail —
 * stack traces and status codes belong in the logger, never in the UI.
 *
 * @param {object} props
 * @param {'page' | 'inline'} [props.variant] - Layout variant. Defaults to 'page'.
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.requestId]
 * @param {Array<{ label: string, onClick?: () => void, href?: string, variant?: 'primary' | 'secondary' }>} [props.actions]
 */
export default function ErrorFallback({
  variant = 'page',
  title = 'Something went wrong',
  description = 'We hit an unexpected issue. Try again — if it keeps happening, please let us know.',
  requestId,
  actions,
}) {
  const containerClass = variant === 'inline' ? styles.inline : styles.page;
  return (
    <div className={containerClass} role="alert" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.glyph} aria-hidden="true">
          <AlertGlyph />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {requestId && (
          <div className={styles.requestId} aria-label="Reference code">
            Ref: {requestId}
          </div>
        )}
        {actions && actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action) => (
              <FallbackAction key={action.label} {...action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FallbackAction({ label, onClick, href, variant = 'primary' }) {
  const className = variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary;
  if (href) {
    return (
      <a className={className} href={href}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

function AlertGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}
