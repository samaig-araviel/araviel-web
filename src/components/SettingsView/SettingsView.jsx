import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import {
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  UserIcon,
  SettingsIcon,
  EditIcon,
} from '../Icons';
import styles from './SettingsView.module.css';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'models', label: 'Model preferences' },
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
];

const TONES = [
  { id: 'default', label: 'Default', description: 'Balanced and natural responses' },
  { id: 'concise', label: 'Concise', description: 'Brief, straight to the point' },
  { id: 'detailed', label: 'Detailed', description: 'Thorough and comprehensive' },
  { id: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
  { id: 'professional', label: 'Professional', description: 'Formal and polished' },
];

export default function SettingsView() {
  const dispatch = useDispatch();
  const themeMode = useSelector(selectTheme);
  const [activeSection, setActiveSection] = useState('profile');
  const [displayName, setDisplayName] = useState('User');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [responseTone, setResponseTone] = useState('default');
  const [customInstructions, setCustomInstructions] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [sendWithEnter, setSendWithEnter] = useState(true);
  const [showCodeLineNumbers, setShowCodeLineNumbers] = useState(true);
  const [enableAnalytics, setEnableAnalytics] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [defaultModel, setDefaultModel] = useState('auto');
  const [enableReasoning, setEnableReasoning] = useState(true);
  const [showModelInfo, setShowModelInfo] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('araviel-settings') || '{}');
      if (s.displayName) setDisplayName(s.displayName);
      if (s.bio) setBio(s.bio);
      if (s.preferredLanguage) setPreferredLanguage(s.preferredLanguage);
      if (s.responseTone) setResponseTone(s.responseTone);
      if (s.customInstructions) setCustomInstructions(s.customInstructions);
      if (s.fontSize) setFontSize(s.fontSize);
      if (s.sendWithEnter !== undefined) setSendWithEnter(s.sendWithEnter);
      if (s.showCodeLineNumbers !== undefined) setShowCodeLineNumbers(s.showCodeLineNumbers);
      if (s.enableAnalytics !== undefined) setEnableAnalytics(s.enableAnalytics);
      if (s.saveHistory !== undefined) setSaveHistory(s.saveHistory);
      if (s.defaultModel) setDefaultModel(s.defaultModel);
      if (s.enableReasoning !== undefined) setEnableReasoning(s.enableReasoning);
      if (s.showModelInfo !== undefined) setShowModelInfo(s.showModelInfo);
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    const settings = {
      displayName,
      bio,
      preferredLanguage,
      responseTone,
      customInstructions,
      fontSize,
      sendWithEnter,
      showCodeLineNumbers,
      enableAnalytics,
      saveHistory,
      defaultModel,
      enableReasoning,
      showModelInfo,
    };
    localStorage.setItem('araviel-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBack = () => {
    dispatch(setActiveItem('home'));
  };

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
          >
            {saved ? 'Saved!' : 'Save changes'}
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
                    <span className={styles.avatarName}>{displayName}</span>
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
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Bio</label>
                  <textarea
                    className={styles.fieldTextarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    rows={3}
                  />
                  <span className={styles.fieldHint}>This helps personalize your experience.</span>
                </div>
              </section>
            )}

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
                          fontSize === size ? styles.segmentedBtnActive : ''
                        }`}
                        onClick={() => setFontSize(size)}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
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
                    <button
                      className={`${styles.toggle} ${showCodeLineNumbers ? styles.toggleOn : ''}`}
                      onClick={() => setShowCodeLineNumbers(!showCodeLineNumbers)}
                      aria-checked={showCodeLineNumbers}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Send message with Enter</span>
                      <span className={styles.toggleDesc}>
                        Use Enter to send messages. When off, use Ctrl+Enter instead.
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${sendWithEnter ? styles.toggleOn : ''}`}
                      onClick={() => setSendWithEnter(!sendWithEnter)}
                      aria-checked={sendWithEnter}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'personalization' && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Personalization</h2>
                  <p className={styles.sectionDesc}>
                    Help Araviel understand you better for more relevant responses.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Preferred language</label>
                  <select
                    className={styles.fieldSelect}
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
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
                          responseTone === tone.id ? styles.toneCardActive : ''
                        }`}
                        onClick={() => setResponseTone(tone.id)}
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
                    instructions will apply to all conversations.
                  </p>
                  <textarea
                    className={styles.fieldTextarea}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. I'm a software engineer. I prefer code examples in TypeScript. Always explain your reasoning step by step..."
                    rows={5}
                  />
                  <div className={styles.textareaFooter}>
                    <span className={styles.fieldHint}>
                      {customInstructions.length} / 2000 characters
                    </span>
                  </div>
                </div>
              </section>
            )}

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
                        defaultModel === 'auto' ? styles.segmentedBtnActive : ''
                      }`}
                      onClick={() => setDefaultModel('auto')}
                    >
                      Auto (recommended)
                    </button>
                    <button
                      className={`${styles.segmentedBtn} ${
                        defaultModel === 'manual' ? styles.segmentedBtnActive : ''
                      }`}
                      onClick={() => setDefaultModel('manual')}
                    >
                      Manual
                    </button>
                  </div>
                  <span className={styles.fieldHint}>
                    {defaultModel === 'auto'
                      ? 'Araviel automatically picks the best model for each query.'
                      : 'You choose which model to use for each conversation.'}
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Enable reasoning / thinking</span>
                      <span className={styles.toggleDesc}>
                        Show the model&apos;s step-by-step reasoning process when available.
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${enableReasoning ? styles.toggleOn : ''}`}
                      onClick={() => setEnableReasoning(!enableReasoning)}
                      aria-checked={enableReasoning}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Show model information</span>
                      <span className={styles.toggleDesc}>
                        Display which model generated each response.
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${showModelInfo ? styles.toggleOn : ''}`}
                      onClick={() => setShowModelInfo(!showModelInfo)}
                      aria-checked={showModelInfo}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>
              </section>
            )}

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
                    <button
                      className={`${styles.toggle} ${saveHistory ? styles.toggleOn : ''}`}
                      onClick={() => setSaveHistory(!saveHistory)}
                      aria-checked={saveHistory}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
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
                    <button
                      className={`${styles.toggle} ${enableAnalytics ? styles.toggleOn : ''}`}
                      onClick={() => setEnableAnalytics(!enableAnalytics)}
                      aria-checked={enableAnalytics}
                      role="switch"
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
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
