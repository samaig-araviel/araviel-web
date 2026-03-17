import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { fetchCreditBalance } from '../../services/credits';
import { fetchSettings, saveSettings, DEFAULT_SETTINGS } from '../../services/settings';
import {
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  UserIcon,
  SettingsIcon,
  EditIcon,
  GlobeIcon,
  ZapIcon,
} from '../Icons';
import styles from './SettingsView.module.css';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'models', label: 'Model preferences' },
  { id: 'usage', label: 'Usage & credits' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'data', label: 'Data & privacy' },
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Japanese',
  'Korean',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Arabic',
  'Hindi',
  'Russian',
  'Dutch',
  'Swedish',
  'Turkish',
  'Polish',
  'Thai',
  'Vietnamese',
  'Indonesian',
];

const TONES = [
  { id: 'default', label: 'Default', description: 'Balanced and natural responses' },
  { id: 'concise', label: 'Concise', description: 'Brief, straight to the point' },
  { id: 'detailed', label: 'Detailed', description: 'Thorough and comprehensive' },
  { id: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
  { id: 'professional', label: 'Professional', description: 'Formal and polished' },
];

const SHORTCUTS = [
  { keys: ['/', 'N'], label: 'New chat' },
  { keys: ['/', 'S'], label: 'Open settings' },
  { keys: ['Enter'], label: 'Send message' },
  { keys: ['Shift', 'Enter'], label: 'New line in message' },
  { keys: ['Ctrl', 'Enter'], label: 'Send message (when Enter is off)' },
  { keys: ['Esc'], label: 'Close modal / menu' },
  { keys: ['Ctrl', '/'], label: 'Toggle sidebar' },
  { keys: ['Ctrl', 'Shift', 'C'], label: 'Copy last response' },
];

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
const modKey = isMac ? '⌘' : 'Ctrl';

export default function SettingsView() {
  const dispatch = useDispatch();
  const themeMode = useSelector(selectTheme);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // All settings state
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });

  // Credit balance state
  const [creditBalance, setCreditBalance] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Load settings from backend on mount
  useEffect(() => {
    fetchSettings()
      .then((s) => setSettings(s))
      .finally(() => setLoading(false));
  }, []);

  // Load credit balance when usage tab is shown
  const loadCredits = useCallback(() => {
    setCreditsLoading(true);
    fetchCreditBalance()
      .then((data) => setCreditBalance(data))
      .catch(() => {})
      .finally(() => setCreditsLoading(false));
  }, []);

  useEffect(() => {
    if (activeSection === 'usage') loadCredits();
  }, [activeSection, loadCredits]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBack = () => {
    dispatch(setActiveItem('home'));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>
            <ChevronLeftIcon />
            <span>Back</span>
          </button>
          <div className={styles.headerTitle}>
            <SettingsIcon />
            <h1>Settings</h1>
          </div>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <div className={styles.layout}>
          {/* Sidebar navigation */}
          <nav className={styles.nav}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                className={`${styles.navItem} ${
                  activeSection === section.id ? styles.navItemActive : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Content area */}
          <div className={styles.content}>
            {/* ═══ PROFILE ═══ */}
            {activeSection === 'profile' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Profile</h2>
                  <p className={styles.sectionDesc}>
                    Manage your profile information and how you appear in the app.
                  </p>
                </div>

                <div className={styles.avatarRow}>
                  <div className={styles.avatarLarge}>
                    <UserIcon />
                  </div>
                  <div className={styles.avatarInfo}>
                    <span className={styles.avatarName}>{settings.displayName}</span>
                    <span className={styles.avatarPlan}>Pro plan</span>
                    <button className={styles.avatarEditBtn}>
                      <EditIcon />
                      <span>Change avatar</span>
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Display name</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.displayName}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Bio</label>
                  <textarea
                    className={styles.fieldTextarea}
                    value={settings.bio}
                    onChange={(e) => updateSetting('bio', e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    rows={3}
                  />
                  <span className={styles.fieldHint}>This helps personalize your experience.</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Occupation</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.occupation}
                    onChange={(e) => updateSetting('occupation', e.target.value)}
                    placeholder="e.g. Software Engineer, Designer, Student..."
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Areas of expertise</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.expertise}
                    onChange={(e) => updateSetting('expertise', e.target.value)}
                    placeholder="e.g. Machine learning, Web development, Data analysis..."
                  />
                  <span className={styles.fieldHint}>
                    Araviel will tailor responses to your expertise level.
                  </span>
                </div>
              </section>
            )}

            {/* ═══ APPEARANCE ═══ */}
            {activeSection === 'appearance' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Appearance</h2>
                  <p className={styles.sectionDesc}>Customize how Araviel looks and feels.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Theme</label>
                  <div className={styles.themeCards}>
                    <button
                      className={`${styles.themeCard} ${
                        themeMode === 'light' ? styles.themeCardActive : ''
                      }`}
                      onClick={() => dispatch(setTheme('light'))}
                    >
                      <div className={styles.themeCardPreview} data-theme-preview="light">
                        <div className={styles.themePreviewBar} />
                        <div className={styles.themePreviewContent}>
                          <div className={styles.themePreviewLine} />
                          <div className={styles.themePreviewLineShort} />
                        </div>
                      </div>
                      <div className={styles.themeCardInfo}>
                        <SunIcon />
                        <span>Light</span>
                      </div>
                    </button>
                    <button
                      className={`${styles.themeCard} ${
                        themeMode === 'dark' ? styles.themeCardActive : ''
                      }`}
                      onClick={() => dispatch(setTheme('dark'))}
                    >
                      <div className={`${styles.themeCardPreview} ${styles.themePreviewDark}`}>
                        <div className={styles.themePreviewBar} />
                        <div className={styles.themePreviewContent}>
                          <div className={styles.themePreviewLine} />
                          <div className={styles.themePreviewLineShort} />
                        </div>
                      </div>
                      <div className={styles.themeCardInfo}>
                        <MoonIcon />
                        <span>Dark</span>
                      </div>
                    </button>
                    <button
                      className={`${styles.themeCard} ${
                        themeMode === 'system' ? styles.themeCardActive : ''
                      }`}
                      onClick={() => dispatch(setTheme('system'))}
                    >
                      <div className={`${styles.themeCardPreview} ${styles.themePreviewSystem}`}>
                        <div className={styles.themePreviewBar} />
                        <div className={styles.themePreviewContent}>
                          <div className={styles.themePreviewLine} />
                          <div className={styles.themePreviewLineShort} />
                        </div>
                      </div>
                      <div className={styles.themeCardInfo}>
                        <MonitorIcon />
                        <span>System</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Font size</label>
                  <div className={styles.segmentedControl}>
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        className={`${styles.segmentedBtn} ${
                          settings.fontSize === size ? styles.segmentedBtnActive : ''
                        }`}
                        onClick={() => updateSetting('fontSize', size)}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Answer font style</label>
                  <p className={styles.fieldLabelDesc}>Choose the font style for AI responses.</p>
                  <div className={styles.segmentedControl}>
                    {[
                      { id: 'sans-serif', label: 'Sans-serif' },
                      { id: 'serif', label: 'Serif' },
                      { id: 'mono', label: 'Monospace' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        className={`${styles.segmentedBtn} ${
                          settings.answerFont === font.id ? styles.segmentedBtnActive : ''
                        }`}
                        onClick={() => updateSetting('answerFont', font.id)}
                        style={{ fontFamily: font.id === 'mono' ? 'monospace' : font.id }}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Compact mode</span>
                      <span className={styles.toggleDesc}>
                        Reduce spacing and padding for a denser layout.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.compactMode}
                      onChange={(v) => updateSetting('compactMode', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Show line numbers in code blocks</span>
                      <span className={styles.toggleDesc}>
                        Display line numbers alongside code snippets.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.showCodeLineNumbers}
                      onChange={(v) => updateSetting('showCodeLineNumbers', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Send message with Enter</span>
                      <span className={styles.toggleDesc}>
                        Use Enter to send messages. When off, use {modKey}+Enter instead.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.sendWithEnter}
                      onChange={(v) => updateSetting('sendWithEnter', v)}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ═══ PERSONALIZATION ═══ */}
            {activeSection === 'personalization' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Personalization</h2>
                  <p className={styles.sectionDesc}>
                    Help Araviel understand you better for more relevant responses.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Preferred response language</label>
                  <p className={styles.fieldLabelDesc}>
                    The language Araviel will use when responding to you.
                  </p>
                  <select
                    className={styles.fieldSelect}
                    value={settings.preferredLanguage}
                    onChange={(e) => updateSetting('preferredLanguage', e.target.value)}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Response tone</label>
                  <p className={styles.fieldLabelDesc}>Choose how Araviel communicates with you.</p>
                  <div className={styles.toneGrid}>
                    {TONES.map((tone) => (
                      <button
                        key={tone.id}
                        className={`${styles.toneCard} ${
                          settings.responseTone === tone.id ? styles.toneCardActive : ''
                        }`}
                        onClick={() => updateSetting('responseTone', tone.id)}
                      >
                        <span className={styles.toneCardLabel}>{tone.label}</span>
                        <span className={styles.toneCardDesc}>{tone.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Custom instructions</label>
                  <p className={styles.fieldLabelDesc}>
                    Tell Araviel anything specific about how you&apos;d like it to respond. These
                    instructions apply to all new conversations.
                  </p>
                  <textarea
                    className={styles.fieldTextarea}
                    value={settings.customInstructions}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        updateSetting('customInstructions', e.target.value);
                      }
                    }}
                    placeholder="e.g. I'm a software engineer. I prefer code examples in TypeScript. Always explain your reasoning step by step..."
                    rows={5}
                  />
                  <div className={styles.textareaFooter}>
                    <span className={styles.fieldHint}>
                      {settings.customInstructions.length} / 2,000 characters
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* ═══ MODEL PREFERENCES ═══ */}
            {activeSection === 'models' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Model preferences</h2>
                  <p className={styles.sectionDesc}>
                    Configure how AI models are selected and behave.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Default model selection</label>
                  <div className={styles.segmentedControl}>
                    <button
                      className={`${styles.segmentedBtn} ${
                        settings.defaultModel === 'auto' ? styles.segmentedBtnActive : ''
                      }`}
                      onClick={() => updateSetting('defaultModel', 'auto')}
                    >
                      Auto (recommended)
                    </button>
                    <button
                      className={`${styles.segmentedBtn} ${
                        settings.defaultModel === 'manual' ? styles.segmentedBtnActive : ''
                      }`}
                      onClick={() => updateSetting('defaultModel', 'manual')}
                    >
                      Manual
                    </button>
                  </div>
                  <span className={styles.fieldHint}>
                    {settings.defaultModel === 'auto'
                      ? 'Araviel automatically picks the best model for each query via ADE.'
                      : 'You choose which model to use for each conversation.'}
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Web search</label>
                  <p className={styles.fieldLabelDesc}>
                    Control when Araviel searches the web for current information.
                  </p>
                  <div className={styles.segmentedControl}>
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'always', label: 'Always' },
                      { id: 'never', label: 'Never' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        className={`${styles.segmentedBtn} ${
                          settings.webSearchDefault === opt.id ? styles.segmentedBtnActive : ''
                        }`}
                        onClick={() => updateSetting('webSearchDefault', opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className={styles.fieldHint}>
                    {settings.webSearchDefault === 'auto' &&
                      'Araviel decides when web search is needed based on your query.'}
                    {settings.webSearchDefault === 'always' &&
                      'Every query will include web search results.'}
                    {settings.webSearchDefault === 'never' &&
                      'Web search is disabled. Responses use model knowledge only.'}
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Default image quality</label>
                  <p className={styles.fieldLabelDesc}>
                    Set the default quality for AI-generated images.
                  </p>
                  <div className={styles.segmentedControl}>
                    {[
                      { id: 'standard', label: 'Standard (1 credit)' },
                      { id: 'hd', label: 'HD (2 credits)' },
                      { id: 'ultra', label: 'Ultra (4 credits)' },
                    ].map((q) => (
                      <button
                        key={q.id}
                        className={`${styles.segmentedBtn} ${
                          settings.imageQualityDefault === q.id ? styles.segmentedBtnActive : ''
                        }`}
                        onClick={() => updateSetting('imageQualityDefault', q.id)}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Enable reasoning / thinking</span>
                      <span className={styles.toggleDesc}>
                        Show the model&apos;s step-by-step reasoning process when available.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.enableReasoning}
                      onChange={(v) => updateSetting('enableReasoning', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Show model information</span>
                      <span className={styles.toggleDesc}>
                        Display which model and provider generated each response.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.showModelInfo}
                      onChange={(v) => updateSetting('showModelInfo', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Follow-up suggestions</span>
                      <span className={styles.toggleDesc}>
                        Show suggested follow-up questions after each response.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.enableFollowUps}
                      onChange={(v) => updateSetting('enableFollowUps', v)}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ═══ USAGE & CREDITS ═══ */}
            {activeSection === 'usage' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Usage & credits</h2>
                  <p className={styles.sectionDesc}>
                    Monitor your credit balance and usage across the platform.
                  </p>
                </div>

                {creditsLoading ? (
                  <div className={styles.usageLoading}>
                    <div className={styles.loadingSpinner} />
                    <span>Loading usage data...</span>
                  </div>
                ) : creditBalance ? (
                  <>
                    {/* Credit overview cards */}
                    <div className={styles.creditCards}>
                      <div className={styles.creditCard}>
                        <div className={styles.creditCardIcon}>
                          <ZapIcon />
                        </div>
                        <div className={styles.creditCardBody}>
                          <span className={styles.creditCardValue}>
                            {creditBalance.balance?.monthlyRemaining ?? 0}
                          </span>
                          <span className={styles.creditCardLabel}>Monthly credits</span>
                          <span className={styles.creditCardSub}>
                            of {creditBalance.balance?.monthlyTotal ?? 0} included
                          </span>
                        </div>
                      </div>
                      <div className={styles.creditCard}>
                        <div className={`${styles.creditCardIcon} ${styles.creditCardIconPack}`}>
                          <GlobeIcon />
                        </div>
                        <div className={styles.creditCardBody}>
                          <span className={styles.creditCardValue}>
                            {creditBalance.balance?.packCredits ?? 0}
                          </span>
                          <span className={styles.creditCardLabel}>Pack credits</span>
                          <span className={styles.creditCardSub}>purchased separately</span>
                        </div>
                      </div>
                      <div className={styles.creditCard}>
                        <div className={`${styles.creditCardIcon} ${styles.creditCardIconTotal}`}>
                          <SunIcon />
                        </div>
                        <div className={styles.creditCardBody}>
                          <span className={styles.creditCardValue}>
                            {creditBalance.balance?.totalAvailable ?? 0}
                          </span>
                          <span className={styles.creditCardLabel}>Total available</span>
                          <span className={styles.creditCardSub}>combined balance</span>
                        </div>
                      </div>
                    </div>

                    {/* Usage progress bar */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Monthly usage</label>
                      <div className={styles.usageBarContainer}>
                        <div className={styles.usageBar}>
                          <div
                            className={styles.usageBarFill}
                            style={{
                              width: `${Math.min(
                                100,
                                creditBalance.balance?.monthlyTotal
                                  ? ((creditBalance.balance.monthlyTotal -
                                      creditBalance.balance.monthlyRemaining) /
                                      creditBalance.balance.monthlyTotal) *
                                      100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                        <div className={styles.usageBarLabels}>
                          <span>
                            {(creditBalance.balance?.monthlyTotal ?? 0) -
                              (creditBalance.balance?.monthlyRemaining ?? 0)}{' '}
                            used
                          </span>
                          <span>{creditBalance.balance?.monthlyTotal ?? 0} total</span>
                        </div>
                      </div>
                      {creditBalance.balance?.cycleResetAt && (
                        <span className={styles.fieldHint}>
                          Resets{' '}
                          {new Date(creditBalance.balance.cycleResetAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      )}
                    </div>

                    {/* Plan tier */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Current plan</label>
                      <div className={styles.planCard}>
                        <div className={styles.planInfo}>
                          <span className={styles.planName}>
                            {(creditBalance.balance?.tier || 'free').charAt(0).toUpperCase() +
                              (creditBalance.balance?.tier || 'free').slice(1)}{' '}
                            plan
                          </span>
                          <span className={styles.planDesc}>
                            {creditBalance.balance?.tier === 'free' && '5 image credits per month'}
                            {creditBalance.balance?.tier === 'pro' && '50 image credits per month'}
                            {creditBalance.balance?.tier === 'premium' &&
                              '200 image credits per month'}
                            {!creditBalance.balance?.tier && '5 image credits per month'}
                          </span>
                        </div>
                        <button
                          className={styles.planUpgradeBtn}
                          onClick={() => dispatch(setActiveItem('home'))}
                        >
                          {creditBalance.balance?.tier === 'premium' ? 'Manage' : 'Upgrade'}
                        </button>
                      </div>
                    </div>

                    {/* Image quality costs */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Credit costs</label>
                      <div className={styles.costTable}>
                        <div className={styles.costRow}>
                          <span>Standard quality</span>
                          <span className={styles.costValue}>1 credit</span>
                        </div>
                        <div className={styles.costRow}>
                          <span>HD quality</span>
                          <span className={styles.costValue}>2 credits</span>
                        </div>
                        <div className={styles.costRow}>
                          <span>Ultra quality</span>
                          <span className={styles.costValue}>4 credits</span>
                        </div>
                      </div>
                    </div>

                    <button className={styles.refreshBtn} onClick={loadCredits}>
                      Refresh usage data
                    </button>
                  </>
                ) : (
                  <div className={styles.usageEmpty}>
                    <p>Unable to load usage data. Check your connection and try again.</p>
                    <button className={styles.refreshBtn} onClick={loadCredits}>
                      Retry
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ═══ NOTIFICATIONS ═══ */}
            {activeSection === 'notifications' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Notifications</h2>
                  <p className={styles.sectionDesc}>Choose what you want to be notified about.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>New features & updates</span>
                      <span className={styles.toggleDesc}>
                        Get notified when new features or improvements are available.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.notifyNewFeatures}
                      onChange={(v) => updateSetting('notifyNewFeatures', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Usage limit warnings</span>
                      <span className={styles.toggleDesc}>
                        Get alerted when you&apos;re approaching your credit or usage limits.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.notifyUsageLimits}
                      onChange={(v) => updateSetting('notifyUsageLimits', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Sound effects</span>
                      <span className={styles.toggleDesc}>
                        Play a sound when a response finishes generating.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.notifySounds}
                      onChange={(v) => updateSetting('notifySounds', v)}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ═══ SHORTCUTS ═══ */}
            {activeSection === 'shortcuts' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Keyboard shortcuts</h2>
                  <p className={styles.sectionDesc}>
                    Speed up your workflow with these keyboard shortcuts.
                  </p>
                </div>

                <div className={styles.shortcutList}>
                  {SHORTCUTS.map((shortcut, i) => (
                    <div key={i} className={styles.shortcutRow}>
                      <span className={styles.shortcutLabel}>{shortcut.label}</span>
                      <div className={styles.shortcutKeys}>
                        {shortcut.keys.map((key, j) => (
                          <span key={j}>
                            <kbd className={styles.kbd}>{key === 'Ctrl' ? modKey : key}</kbd>
                            {j < shortcut.keys.length - 1 && (
                              <span className={styles.kbdPlus}>+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ DATA & PRIVACY ═══ */}
            {activeSection === 'data' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Data & privacy</h2>
                  <p className={styles.sectionDesc}>Control how your data is stored and used.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Save conversation history</span>
                      <span className={styles.toggleDesc}>
                        Keep your conversations for future reference. Turning this off will not
                        delete existing conversations.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.saveHistory}
                      onChange={(v) => updateSetting('saveHistory', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>AI data retention</span>
                      <span className={styles.toggleDesc}>
                        Allow Araviel to use your conversations to improve AI models. Turn this off
                        to exclude your data.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.aiDataRetention}
                      onChange={(v) => updateSetting('aiDataRetention', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Location metadata</span>
                      <span className={styles.toggleDesc}>
                        Allow Araviel to use coarse location data (city/region) to improve
                        responses.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.locationMetadata}
                      onChange={(v) => updateSetting('locationMetadata', v)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Usage analytics</span>
                      <span className={styles.toggleDesc}>
                        Help improve Araviel by sharing anonymous usage data.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.enableAnalytics}
                      onChange={(v) => updateSetting('enableAnalytics', v)}
                    />
                  </div>
                </div>

                {/* Export data */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Export your data</label>
                  <p className={styles.fieldLabelDesc}>
                    Download a copy of your conversations and settings.
                  </p>
                  <button
                    className={styles.outlineBtn}
                    onClick={() => {
                      const data = JSON.stringify(settings, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'araviel-settings-export.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export settings
                  </button>
                </div>

                <div className={styles.dangerZone}>
                  <h3 className={styles.dangerTitle}>Danger zone</h3>
                  <div className={styles.dangerCard}>
                    <div className={styles.dangerInfo}>
                      <span className={styles.dangerLabel}>Delete all conversations</span>
                      <span className={styles.dangerDesc}>
                        Permanently remove all conversation history. This cannot be undone.
                      </span>
                    </div>
                    <button className={styles.dangerBtn}>Delete all</button>
                  </div>
                  <div className={styles.dangerCard}>
                    <div className={styles.dangerInfo}>
                      <span className={styles.dangerLabel}>Delete account</span>
                      <span className={styles.dangerDesc}>
                        Permanently delete your account and all associated data.
                      </span>
                    </div>
                    <button className={styles.dangerBtn}>Delete account</button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable toggle switch component ──
function ToggleSwitch({ value, onChange }) {
  return (
    <button
      className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}
