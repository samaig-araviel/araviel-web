import styles from './PricingView.module.css';

export default function BillingToggle({ billingCycle, onChange }) {
  return (
    <div className={styles.billingToggle} role="radiogroup" aria-label="Billing cycle">
      <button
        className={`${styles.billingOption} ${
          billingCycle === 'monthly' ? styles.billingOptionActive : ''
        }`}
        onClick={() => onChange('monthly')}
        role="radio"
        aria-checked={billingCycle === 'monthly'}
      >
        Monthly
      </button>
      <button
        className={`${styles.billingOption} ${
          billingCycle === 'annual' ? styles.billingOptionActive : ''
        }`}
        onClick={() => onChange('annual')}
        role="radio"
        aria-checked={billingCycle === 'annual'}
      >
        Annual
        <span className={styles.saveBadge}>Save 20%</span>
      </button>
    </div>
  );
}
