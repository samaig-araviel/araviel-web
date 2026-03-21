import { useState, useEffect, useRef } from 'react';
import {
  getDisplayPrice,
  isDowngrade,
  isUpgrade,
  SubscriptionTier,
} from '../../config/subscription';
import styles from './PricingView.module.css';

// Per-tier highlight features (incremental, what's new vs previous tier)
const TIER_HIGHLIGHTS = {
  [SubscriptionTier.Free]: {
    sectionLabel: 'Includes',
    features: [
      'Models from ChatGPT, Claude, Gemini and Grok',
      'Best model picked for you automatically',
      'Basic web search',
      '3-day chat history',
    ],
    limited: ['Budget models only', 'No file uploads or projects'],
  },
  [SubscriptionTier.Lite]: {
    sectionLabel: 'Everything in Free, plus:',
    features: [
      '31 models across all 6 providers',
      'Claude Sonnet 4.5, GPT-4.1, Gemini 3 Flash',
      'Full web search and premium image generation',
      '3 projects with file uploads',
      'Full ADE routing (cost-optimised)',
      'Quick prompts library',
    ],
  },
  [SubscriptionTier.Pro]: {
    sectionLabel: 'Everything in Lite, plus:',
    features: [
      '41 models including all flagships',
      'Claude Sonnet 4.6, GPT-5.2, Gemini 2.5 Pro',
      'Thinking and reasoning mode',
      'Deep research',
      'Unlimited history, projects, and uploads',
      'Routing transparency panel',
      'Chat search',
    ],
  },
  [SubscriptionTier.Ultra]: {
    sectionLabel: 'Everything in Pro, plus:',
    features: [
      '52 models incl. Claude Opus and GPT-5.2 Pro',
      'Video generation with Sora and Veo',
      'Realtime audio',
      'Model comparison (side-by-side)',
      'Priority support',
    ],
  },
  [SubscriptionTier.Apex]: {
    sectionLabel: 'Everything in Ultra, plus:',
    features: [
      'Personal API access key',
      'Custom routing profiles',
      'Early access to new models',
      'Zero cost-bias ADE routing',
    ],
  },
};

function AnimatedPrice({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    const from = prevRef.current;
    const to = value;
    const duration = 400;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value]);

  if (value === 0) {
    return <span className={styles.priceAmount}>£0</span>;
  }

  const whole = Math.floor(display);
  const decimal = Math.round((display - whole) * 100)
    .toString()
    .padStart(2, '0');

  return (
    <span className={styles.priceAmount}>
      £{whole}
      <span className={styles.priceDecimal}>.{decimal}</span>
    </span>
  );
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinusIcon({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function TierCard({ tier, billingCycle, currentTier, isAuthenticated }) {
  const price = getDisplayPrice(tier, billingCycle);
  const isCurrent = isAuthenticated && currentTier === tier.id;
  const isDown = isAuthenticated && currentTier && isDowngrade(currentTier, tier.id);
  const isUp = isAuthenticated && currentTier && isUpgrade(currentTier, tier.id);
  const highlights = TIER_HIGHLIGHTS[tier.id];

  const getCtaText = () => {
    if (isCurrent) return 'Current Plan';
    if (!isAuthenticated) {
      if (tier.monthlyPrice === 0) return 'Sign up free';
      return `Start with ${tier.name}`;
    }
    if (isDown) return 'Downgrade';
    if (isUp) return `Upgrade to ${tier.name}`;
    return tier.ctaText;
  };

  const hasLaunchOffer = tier.isLaunchOffer;
  const fullPrice =
    billingCycle === 'annual' ? tier.fullAnnualPricePerMonth : tier.fullMonthlyPrice;

  return (
    <div
      className={`${styles.tierCard} ${tier.highlighted ? styles.tierCardHighlighted : ''} ${
        isCurrent ? styles.tierCardCurrent : ''
      }`}
      aria-label={`${tier.name} plan, ${price === 0 ? 'Free' : `£${price.toFixed(2)} per month`}`}
    >
      {tier.highlighted && <div className={styles.popularBadge}>Most Popular</div>}

      {/* Top section: name, price, badges */}
      <div className={styles.tierTop}>
        <div className={styles.tierHeader}>
          <h3 className={styles.tierName}>{tier.name}</h3>
          <p className={styles.tierTagline}>{tier.tagline}</p>
        </div>

        <div className={styles.priceBlock}>
          {hasLaunchOffer && fullPrice && (
            <span className={styles.priceStrikethrough}>£{fullPrice.toFixed(2)}</span>
          )}
          <AnimatedPrice value={price} />
          {tier.monthlyPrice > 0 ? (
            <span className={styles.priceUnit}>/month</span>
          ) : (
            <span className={styles.priceUnit}>Free forever</span>
          )}
        </div>

        {tier.monthlyPrice > 0 && (
          <div className={styles.priceSubtext}>
            {billingCycle === 'annual'
              ? `£${tier.annualTotal.toFixed(2)} billed annually`
              : `Or £${tier.annualPricePerMonth.toFixed(2)}/mo billed annually`}
          </div>
        )}

        {hasLaunchOffer && (
          <div className={styles.launchBadge}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Launch price for the first {tier.launchSpotsTotal} users
          </div>
        )}

        {tier.firstMonthBonusCredits > 0 && (
          <div className={styles.bonusBadge}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            First month: 2x credits ({tier.firstMonthBonusCredits}/day)
          </div>
        )}
      </div>

      {/* CTA button - always at the same vertical position */}
      <div className={styles.tierCta}>
        <button
          className={`${styles.ctaButton} ${isCurrent ? styles.ctaButtonCurrent : ''} ${
            tier.highlighted && !isCurrent ? styles.ctaButtonHighlighted : ''
          } ${isUp && !tier.highlighted ? styles.ctaButtonUpgrade : ''}`}
          disabled={isCurrent}
          aria-label={getCtaText()}
        >
          {getCtaText()}
        </button>
      </div>

      <div className={styles.cardDivider} />

      {/* Features section - grows to fill remaining space */}
      <div className={styles.cardFeaturesSection}>
        <div className={styles.cardFeaturesLabel}>{highlights.sectionLabel}</div>
        <ul className={styles.featureList}>
          {highlights.features.map((text) => (
            <li key={text} className={styles.featureItem}>
              <CheckIcon className={styles.featureIconCheck} />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {highlights.limited && (
          <>
            <div className={styles.cardLimitedLabel}>Limitations</div>
            <ul className={styles.featureList}>
              {highlights.limited.map((text) => (
                <li key={text} className={styles.featureItemLimited}>
                  <MinusIcon className={styles.featureIconLimited} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
