import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import {
  selectCurrentTier,
  selectTextCredits,
  selectImageCredits,
  selectPeriodEnd,
  selectCancelAtPeriodEnd,
  selectPortalLoading,
  createPortalThunk,
} from '../../store/slices/subscriptionSlice';
import { getTierById } from '../../config/subscription';
import {
  selectIsAuthenticated,
  selectAuthUser,
  setUserAvatarUrl,
} from '../../store/slices/authSlice';
import {
  setTone,
  setWebSearchEnabled,
  setExtendedThinking,
  setImageQuality,
} from '../../store/slices/chatSlice';
import { fetchCreditBalance, buyPack } from '../../services/credits';
import { IMAGE_PACKS } from '../../config/credits';
import {
  fetchSettings,
  saveSettings,
  uploadAvatar,
  DEFAULT_SETTINGS,
} from '../../services/settings';
import { GuestGate } from '../GuestGate';
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
  { id: 'default', label: 'Default', description: 'Preset style and tone' },
  { id: 'professional', label: 'Professional', description: 'Polished and precise' },
  { id: 'friendly', label: 'Friendly', description: 'Warm and chatty' },
  { id: 'candid', label: 'Candid', description: 'Direct and encouraging' },
  { id: 'quirky', label: 'Quirky', description: 'Playful and imaginative' },
  { id: 'efficient', label: 'Efficient', description: 'Concise and plain' },
  { id: 'cynical', label: 'Cynical', description: 'Critical and sarcastic' },
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

export default function SettingsView({ initialSection }) {
  const dispatch = useDispatch();
  const themeMode = useSelector(selectTheme);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authUser = useSelector(selectAuthUser);
  const currentTier = useSelector(selectCurrentTier);
  const textCredits = useSelector(selectTextCredits);
  const imageCredits = useSelector(selectImageCredits);
  const periodEnd = useSelector(selectPeriodEnd);
  const cancelAtPeriodEnd = useSelector(selectCancelAtPeriodEnd);
  const portalLoading = useSelector(selectPortalLoading);
  const [activeSection, setActiveSection] = useState(initialSection || 'profile');
  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // All settings state
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });

  // Avatar upload state
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Credit balance state
  const [creditBalance, setCreditBalance] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Load settings from backend on mount (authenticated users only)
  // Pre-populate empty fields from auth provider (e.g. Google OAuth)
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchSettings()
      .then((s) => {
        const merged = { ...s };
        if (!merged.fullName && authUser?.fullName) {
          merged.fullName = authUser.fullName;
        }
        if ((!merged.displayName || merged.displayName === 'User') && authUser?.fullName) {
          merged.displayName = authUser.fullName;
        }
        // Sync avatar to Redux so sidebar and other components reflect it
        if (merged.avatarUrl) {
          dispatch(setUserAvatarUrl(merged.avatarUrl));
        }
        setSettings(merged);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, authUser, dispatch]);

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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { avatarUrl } = await uploadAvatar(file);
      updateSetting('avatarUrl', avatarUrl);
      dispatch(setUserAvatarUrl(avatarUrl));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ChevronLeftIcon />
              <span>Back</span>
            </button>
            <div className={styles.headerTitle}>
              <SettingsIcon />
              <h1>Settings</h1>
            </div>
          </div>
          <GuestGate
            icon={<SettingsIcon />}
            title="Your settings, your way"
            description="Sign in to personalise your experience, manage your profile, and configure preferences."
            actionLabel="Sign in to access Settings"
          />
        </div>
      </div>
    );
  }

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

                {(() => {
                  const resolvedAvatar = settings.avatarUrl || authUser?.avatarUrl;
                  const resolvedName =
                    settings.displayName && settings.displayName !== 'User'
                      ? settings.displayName
                      : authUser?.fullName || settings.displayName || 'User';
                  return (
                    <div className={styles.avatarRow}>
                      <div
                        className={`${styles.avatarLarge} ${
                          avatarUploading ? styles.avatarUploading : ''
                        }`}
                      >
                        {resolvedAvatar ? (
                          <img
                            src={resolvedAvatar}
                            alt="Avatar"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className={styles.avatarImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = '';
                            }}
                          />
                        ) : null}
                        <span style={{ display: resolvedAvatar ? 'none' : '' }}>
                          <UserIcon />
                        </span>
                      </div>
                      <div className={styles.avatarInfo}>
                        <span className={styles.avatarName}>{resolvedName}</span>
                        {authUser?.email && (
                          <span className={styles.avatarPlan}>{authUser.email}</span>
                        )}
                        <button
                          className={styles.avatarEditBtn}
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarUploading}
                        >
                          <EditIcon />
                          <span>{avatarUploading ? 'Uploading...' : 'Change avatar'}</span>
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Full name</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.fullName}
                    onChange={(e) => updateSetting('fullName', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Display name</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.displayName}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    placeholder="What should Araviel call you?"
                  />
                  <span className={styles.fieldHint}>
                    This is the name Araviel uses to address you.
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email</label>
                  <input
                    className={styles.fieldInputReadonly}
                    value={authUser?.email || ''}
                    readOnly
                  />
                  <span className={styles.fieldHint}>Managed by your authentication provider.</span>
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

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone</label>
                  <input
                    className={styles.fieldInput}
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Website</label>
                  <input
                    className={styles.fieldInput}
                    type="url"
                    value={settings.website}
                    onChange={(e) => updateSetting('website', e.target.value)}
                    placeholder="e.g. https://yoursite.com"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Location</label>
                  <input
                    className={styles.fieldInput}
                    value={settings.location}
                    onChange={(e) => updateSetting('location', e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                  />
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
                        onClick={() => {
                          updateSetting('responseTone', tone.id);
                          dispatch(setTone(tone.id));
                        }}
                      >
                        <span className={styles.toneCardLabel}>{tone.label}</span>
                        <span className={styles.toneCardDesc}>{tone.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    What personal preferences should Araviel consider in responses?
                  </label>
                  <p className={styles.fieldLabelDesc}>
                    Your preferences will apply to all conversations.
                  </p>
                  <textarea
                    className={styles.fieldTextarea}
                    value={settings.customInstructions}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        updateSetting('customInstructions', e.target.value);
                      }
                    }}
                    placeholder="e.g. When writing code, be very concise. Follow good coding principles and practices. Always adhere to good programming principles, OOP, DRY, SOLID, etc when writing code. All code must be written at top quality, clean, easy to read and understand..."
                    rows={6}
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
                        onClick={() => {
                          updateSetting('webSearchDefault', opt.id);
                          const val =
                            opt.id === 'always' ? true : opt.id === 'never' ? false : null;
                          dispatch(setWebSearchEnabled(val));
                        }}
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
                        onClick={() => {
                          updateSetting('imageQualityDefault', q.id);
                          dispatch(setImageQuality(q.id));
                        }}
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
                        Enable deep chain-of-thought reasoning when available.
                      </span>
                    </div>
                    <ToggleSwitch
                      value={settings.enableReasoning}
                      onChange={(v) => {
                        updateSetting('enableReasoning', v);
                        dispatch(setExtendedThinking(v));
                      }}
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
                    Monitor your credit balance and manage your plan.
                  </p>
                </div>

                {/* ── Subscription management ── */}
                {(() => {
                  const tierInfo = getTierById(currentTier);
                  const tierName =
                    tierInfo?.name ||
                    currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1) ||
                    'Free';
                  const tierId = currentTier || 'free';
                  const badgeClass =
                    tierId === 'pro'
                      ? styles.planBadgePro
                      : tierId === 'lite'
                      ? styles.planBadgeLite
                      : styles.planBadgeFree;

                  // Text credits
                  const monthlyLimit = textCredits?.monthlyLimit || 0;
                  const monthlyUsed = textCredits?.monthlyUsed || 0;
                  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
                  const monthlyPct =
                    monthlyLimit > 0
                      ? Math.min(100, Math.round((monthlyRemaining / monthlyLimit) * 100))
                      : 0;
                  const monthlyRatio = monthlyLimit > 0 ? monthlyRemaining / monthlyLimit : 1;
                  const monthlyColor =
                    monthlyRatio > 0.5
                      ? styles.creditProgressHealthy
                      : monthlyRatio > 0.2
                      ? styles.creditProgressLow
                      : styles.creditProgressCritical;

                  // 3-hour window
                  const windowLimit = textCredits?.windowLimit || 0;
                  const windowUsed = textCredits?.windowUsed || 0;
                  const windowRemaining = Math.max(0, windowLimit - windowUsed);
                  const windowPct =
                    windowLimit > 0
                      ? Math.min(100, Math.round((windowRemaining / windowLimit) * 100))
                      : 0;
                  const windowRatio = windowLimit > 0 ? windowRemaining / windowLimit : 1;
                  const windowColor =
                    windowRatio > 0.5
                      ? styles.creditProgressHealthy
                      : windowRatio > 0.2
                      ? styles.creditProgressLow
                      : styles.creditProgressCritical;
                  const windowResetAt = textCredits?.windowResetAt;

                  // Image credits
                  const imgRemaining = imageCredits?.remaining || 0;
                  const imgLimit = imageCredits?.limit || 0;
                  const imgPct =
                    imgLimit > 0 ? Math.min(100, Math.round((imgRemaining / imgLimit) * 100)) : 0;
                  const imgRatio = imgLimit > 0 ? imgRemaining / imgLimit : 1;
                  const imgColor =
                    imgRatio > 0.5
                      ? styles.creditProgressHealthy
                      : imgRatio > 0.2
                      ? styles.creditProgressLow
                      : styles.creditProgressCritical;
                  const cycleResetsAt = imageCredits?.cycleResetsAt;

                  return (
                    <div className={styles.subscriptionSection}>
                      <div className={styles.planRow}>
                        <span className={`${styles.planBadge} ${badgeClass}`}>{tierName}</span>
                      </div>

                      {/* Text credits */}
                      <div className={styles.creditProgressSection}>
                        <div className={styles.creditProgressLabel}>
                          <span>Text credits</span>
                          <span>{monthlyPct}% used</span>
                        </div>
                        <div className={styles.creditProgressBar}>
                          <div
                            className={`${styles.creditProgressFill} ${monthlyColor}`}
                            style={{ width: `${monthlyPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Current session (3-hour window) */}
                      {windowResetAt && (
                        <div className={styles.creditProgressSection}>
                          <div className={styles.creditProgressLabel}>
                            <span>Current session</span>
                            <span>{windowPct}% used</span>
                          </div>
                          <div className={styles.creditProgressBar}>
                            <div
                              className={`${styles.creditProgressFill} ${windowColor}`}
                              style={{ width: `${windowPct}%` }}
                            />
                          </div>
                          <div className={styles.creditProgressLabel}>
                            <span>
                              Resets at{' '}
                              {new Date(windowResetAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Image credits */}
                      <div className={styles.creditProgressSection}>
                        <div className={styles.creditProgressLabel}>
                          <span>Image credits</span>
                          <span>{imgPct}% used</span>
                        </div>
                        <div className={styles.creditProgressBar}>
                          <div
                            className={`${styles.creditProgressFill} ${imgColor}`}
                            style={{ width: `${imgPct}%` }}
                          />
                        </div>
                        {cycleResetsAt && (
                          <div className={styles.creditProgressLabel}>
                            <span>
                              Resets{' '}
                              {new Date(cycleResetsAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {periodEnd && (
                        <div className={styles.billingInfo}>
                          Next billing:{' '}
                          {new Date(periodEnd).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      )}

                      {cancelAtPeriodEnd && (
                        <div className={styles.cancelNotice}>
                          Your plan will be cancelled at the end of the current period
                        </div>
                      )}

                      {(tierId === 'free' || tierId === 'lite') && (
                        <div className={styles.subscriptionActions}>
                          <button
                            className={styles.upgradeBtn}
                            onClick={() => dispatch(setActiveItem('pricing'))}
                          >
                            Upgrade Plan
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {creditsLoading ? (
                  <div className={styles.usageLoading}>
                    <div className={styles.loadingSpinner} />
                    <span>Loading usage data...</span>
                  </div>
                ) : creditBalance?.balance ? (
                  <>
                    {/* ── Current plan card ── */}
                    {(() => {
                      const tier = creditBalance.balance.tier || 'free';
                      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
                      const tierCredits = creditBalance.tiers?.[tier] ?? 5;
                      return (
                        <div className={styles.planCard}>
                          <div className={styles.planInfo}>
                            <span className={styles.planName}>
                              <span
                                className={`${styles.tierBadge} ${
                                  styles[`tierBadge${tierLabel}`] || ''
                                }`}
                              >
                                {tierLabel}
                              </span>
                              {tierLabel} plan
                            </span>
                            <span className={styles.planDesc}>
                              {tierCredits} image credits per month
                            </span>
                          </div>
                          <button
                            className={styles.planUpgradeBtn}
                            onClick={() =>
                              tier === 'free'
                                ? dispatch(setActiveItem('pricing'))
                                : dispatch(createPortalThunk())
                            }
                            disabled={tier !== 'free' && portalLoading}
                          >
                            {tier === 'free'
                              ? 'Upgrade plan'
                              : portalLoading
                              ? 'Opening...'
                              : 'Manage plan'}
                          </button>
                        </div>
                      );
                    })()}

                    {/* ── Plan usage limits ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Plan usage limits</label>

                      {/* Monthly image credits */}
                      {(() => {
                        const monthly = creditBalance.balance.monthly || {
                          total: 0,
                          used: 0,
                          remaining: 0,
                        };
                        const pct = monthly.total
                          ? Math.round((monthly.used / monthly.total) * 100)
                          : 0;
                        const resetDate = creditBalance.balance.cycleResetsAt
                          ? new Date(creditBalance.balance.cycleResetsAt)
                          : null;
                        const daysUntilReset = resetDate
                          ? Math.max(
                              0,
                              Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                            )
                          : null;
                        return (
                          <div className={styles.usageRow}>
                            <div className={styles.usageRowHeader}>
                              <span className={styles.usageRowLabel}>Image credits</span>
                              <span className={styles.usageRowValue}>{pct}% used</span>
                            </div>
                            <div className={styles.usageProgressBar}>
                              <div
                                className={`${styles.usageProgressFill} ${
                                  pct > 80 ? styles.usageProgressFillWarn : ''
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className={styles.usageRowFooter}>
                              <span>
                                {monthly.used} of {monthly.total} used
                              </span>
                              {daysUntilReset !== null && (
                                <span>
                                  Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pack credits */}
                      {(() => {
                        const packs = creditBalance.balance.packs || {
                          total: 0,
                          used: 0,
                          remaining: 0,
                        };
                        const packPct = packs.total
                          ? Math.round((packs.used / packs.total) * 100)
                          : 0;
                        return (
                          <div className={styles.usageRow}>
                            <div className={styles.usageRowHeader}>
                              <span className={styles.usageRowLabel}>Purchased credits</span>
                              <span className={styles.usageRowValue}>
                                {packs.remaining} remaining
                              </span>
                            </div>
                            <div className={styles.usageProgressBar}>
                              <div
                                className={`${styles.usageProgressFill} ${styles.usageProgressFillPack}`}
                                style={{
                                  width: `${packs.total ? Math.min(100, 100 - packPct) : 0}%`,
                                }}
                              />
                            </div>
                            <div className={styles.usageRowFooter}>
                              <span>
                                {packs.used} of {packs.total} used
                              </span>
                              <span>Packs expire after 90 days</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── Total available ── */}
                    <div className={styles.totalCreditsCard}>
                      <div className={styles.totalCreditsLeft}>
                        <span className={styles.totalCreditsValue}>
                          {creditBalance.balance.combined ?? 0}
                        </span>
                        <span className={styles.totalCreditsLabel}>Total credits available</span>
                      </div>
                      <span className={styles.totalCreditsSub}>
                        {creditBalance.balance.monthly?.remaining ?? 0} monthly +{' '}
                        {creditBalance.balance.packs?.remaining ?? 0} pack
                      </span>
                    </div>

                    {/* ── Credit costs ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Image generation costs</label>
                      <div className={styles.costTable}>
                        <div className={styles.costRow}>
                          <span>Standard quality</span>
                          <span className={styles.costValue}>
                            {creditBalance.costs?.standard ?? 1} credit
                          </span>
                        </div>
                        <div className={styles.costRow}>
                          <span>HD quality</span>
                          <span className={styles.costValue}>
                            {creditBalance.costs?.hd ?? 2} credits
                          </span>
                        </div>
                        <div className={styles.costRow}>
                          <span>Ultra quality</span>
                          <span className={styles.costValue}>
                            {creditBalance.costs?.ultra ?? 4} credits
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Add more credits ── */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Add more credits</label>
                      <p className={styles.fieldLabelDesc}>
                        Purchase credit packs for additional image generations. Credits expire after
                        90 days.
                      </p>
                      <div className={styles.packCards}>
                        {Object.entries(creditBalance.packs || {}).map(([key, pack]) => {
                          const price = IMAGE_PACKS[key]?.price || pack.price;
                          return (
                            <div key={key} className={styles.packCard}>
                              <div className={styles.packCardBody}>
                                <span className={styles.packCardCredits}>{pack.credits}</span>
                                <span className={styles.packCardLabel}>{pack.label}</span>
                                {price && <span className={styles.packCardPrice}>{price}</span>}
                              </div>
                              <button
                                className={styles.packCardBtn}
                                onClick={async () => {
                                  try {
                                    await buyPack(key);
                                    loadCredits();
                                  } catch (err) {
                                    console.error('Failed to buy pack:', err);
                                  }
                                }}
                              >
                                Add credits
                              </button>
                            </div>
                          );
                        })}
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
