import { useState, useRef, useCallback } from 'react';
import {
  CloseIcon,
  UploadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '../Icons';
import { AnthropicLogo, OpenAILogo, GoogleLogo, PerplexityLogo, XAILogo } from '../ProviderLogos';
import { FileTextIcon } from '../Icons';
import styles from './ImportConversationsModal.module.css';

const PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    format: 'JSON export',
    Logo: OpenAILogo,
    color: '#10a37f',
    bgColor: 'rgba(16, 163, 127, 0.08)',
    instructions: [
      { text: 'Go to <strong>Settings</strong> in ChatGPT' },
      { text: 'Select <strong>Data Controls</strong>, then click <strong>Export Data</strong>' },
      { text: 'Check your email and download the export <code>.zip</code> file' },
      { text: 'Extract the zip and find <code>conversations.json</code>' },
      { text: 'Upload that file below' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    format: 'JSON export',
    Logo: AnthropicLogo,
    color: '#cc785c',
    bgColor: 'rgba(204, 120, 92, 0.08)',
    instructions: [
      { text: 'Open <strong>Claude</strong> and go to <strong>Settings</strong>' },
      { text: 'Under <strong>Account</strong>, click <strong>Export Data</strong>' },
      { text: 'Download the exported file from your email' },
      { text: 'Extract the zip and locate the conversations JSON file' },
      { text: 'Upload that file below' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    format: 'Google Takeout',
    Logo: GoogleLogo,
    color: '#4285f4',
    bgColor: 'rgba(66, 133, 244, 0.08)',
    instructions: [
      { text: 'Visit <strong>Google Takeout</strong> (takeout.google.com)' },
      { text: 'Deselect all, then select <strong>Gemini Apps</strong>' },
      { text: 'Click <strong>Next Step</strong> and then <strong>Create Export</strong>' },
      { text: 'Download and extract the archive when ready' },
      { text: 'Upload the conversations JSON file below' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    format: 'JSON export',
    Logo: PerplexityLogo,
    color: '#20808d',
    bgColor: 'rgba(32, 128, 141, 0.08)',
    instructions: [
      { text: 'Open <strong>Perplexity</strong> and go to <strong>Settings</strong>' },
      { text: 'Scroll to <strong>Account</strong> and click <strong>Export Data</strong>' },
      { text: 'Download the export file from the link provided' },
      { text: 'Locate the JSON conversations file in the download' },
      { text: 'Upload that file below' },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    format: 'JSON / archive',
    Logo: XAILogo,
    color: '#1d9bf0',
    bgColor: 'rgba(29, 155, 240, 0.08)',
    instructions: [
      { text: 'Go to <strong>x.com/settings</strong> and select <strong>Your Account</strong>' },
      { text: 'Click <strong>Download an archive of your data</strong>' },
      { text: 'Confirm your identity and request the archive' },
      { text: 'Download the archive and extract the Grok conversations' },
      { text: 'Upload the conversations file below' },
    ],
  },
];

function parseConversationsFile(file, providerId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let conversations = [];

        if (providerId === 'chatgpt') {
          const items = Array.isArray(data) ? data : data.conversations || data;
          conversations = (Array.isArray(items) ? items : []).map((conv) => ({
            id: `imported-chatgpt-${conv.id || crypto.randomUUID()}`,
            title: conv.title || 'Untitled Conversation',
            provider: 'chatgpt',
            providerName: 'ChatGPT',
            createdAt: conv.create_time
              ? new Date(conv.create_time * 1000).toISOString()
              : new Date().toISOString(),
            updatedAt: conv.update_time
              ? new Date(conv.update_time * 1000).toISOString()
              : new Date().toISOString(),
            messages: extractChatGPTMessages(conv),
            imported: true,
          }));
        } else {
          const items = Array.isArray(data) ? data : data.conversations || data.chats || data;
          conversations = (Array.isArray(items) ? items : []).map((conv) => ({
            id: `imported-${providerId}-${conv.id || conv.uuid || crypto.randomUUID()}`,
            title: conv.title || conv.name || conv.topic || 'Untitled Conversation',
            provider: providerId,
            providerName: PROVIDERS.find((p) => p.id === providerId)?.name || providerId,
            createdAt:
              conv.created_at || conv.createdAt || conv.create_time
                ? new Date(
                    conv.created_at || conv.createdAt || conv.create_time * 1000
                  ).toISOString()
                : new Date().toISOString(),
            updatedAt:
              conv.updated_at || conv.updatedAt || conv.update_time
                ? new Date(
                    conv.updated_at || conv.updatedAt || conv.update_time * 1000
                  ).toISOString()
                : new Date().toISOString(),
            messages: extractGenericMessages(conv),
            imported: true,
          }));
        }

        if (conversations.length === 0) {
          reject(
            new Error(
              'No conversations found in this file. Please check you selected the correct file.'
            )
          );
          return;
        }

        resolve(conversations);
      } catch {
        reject(new Error("Unable to read this file. Please make sure it's a valid JSON export."));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file. Please try again.'));
    reader.readAsText(file);
  });
}

function extractChatGPTMessages(conv) {
  if (!conv.mapping) return [];
  const messages = [];
  for (const node of Object.values(conv.mapping)) {
    const msg = node.message;
    if (!msg || !msg.content?.parts) continue;
    const content = msg.content.parts.filter((p) => typeof p === 'string').join('\n');
    if (!content.trim()) continue;
    const role =
      msg.author?.role === 'assistant' ? 'assistant' : msg.author?.role === 'user' ? 'user' : null;
    if (!role) continue;
    messages.push({
      id: msg.id || crypto.randomUUID(),
      role,
      content,
      createdAt: msg.create_time
        ? new Date(msg.create_time * 1000).toISOString()
        : new Date().toISOString(),
    });
  }
  return messages;
}

function extractGenericMessages(conv) {
  const msgs = conv.messages || conv.chat_messages || conv.conversation || [];
  if (!Array.isArray(msgs)) return [];
  return msgs
    .map((msg) => ({
      id: msg.id || msg.uuid || crypto.randomUUID(),
      role:
        msg.role === 'assistant' || msg.sender === 'assistant' || msg.sender === 'bot'
          ? 'assistant'
          : 'user',
      content: msg.content || msg.text || msg.message || '',
      createdAt: msg.created_at || msg.createdAt || msg.timestamp || new Date().toISOString(),
    }))
    .filter((m) => m.content.trim());
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportConversationsModal({ onClose, onImport }) {
  const [step, setStep] = useState(0); // 0 = pick provider, 1 = instructions + upload, 2 = importing, 3 = success
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef(null);

  const provider = PROVIDERS.find((p) => p.id === selectedProvider);

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setFile(null);
    setError(null);
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedProvider) return;

    setStep(2);
    setError(null);

    try {
      const conversations = await parseConversationsFile(file, selectedProvider);
      setImportedCount(conversations.length);
      onImport(conversations, selectedProvider);
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  };

  const renderStepIndicator = () => (
    <div className={styles.steps}>
      <div
        className={`${styles.stepDot} ${step >= 0 ? styles.stepDotActive : ''} ${
          step > 0 ? styles.stepDotCompleted : ''
        }`}
      />
      <div className={`${styles.stepLine} ${step >= 1 ? styles.stepLineActive : ''}`} />
      <div
        className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ''} ${
          step > 1 ? styles.stepDotCompleted : ''
        }`}
      />
      <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`} />
      <div className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ''}`} />
    </div>
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <UploadIcon />
            </div>
            <div>
              <div className={styles.headerTitle}>Import Conversations</div>
              <div className={styles.headerSubtitle}>
                {step === 0 && 'Choose your AI provider'}
                {step === 1 && `Import from ${provider?.name}`}
                {step === 2 && 'Processing your data...'}
                {step === 3 && 'Import complete'}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.body}>
          {renderStepIndicator()}

          {/* Step 0: Provider selection */}
          {step === 0 && (
            <div className={styles.providerGrid}>
              {PROVIDERS.map((p) => {
                const Logo = p.Logo;
                return (
                  <button
                    key={p.id}
                    className={`${styles.providerCard} ${
                      selectedProvider === p.id ? styles.providerCardSelected : ''
                    }`}
                    onClick={() => handleProviderSelect(p.id)}
                  >
                    <div
                      className={styles.providerLogo}
                      style={{ backgroundColor: p.bgColor, color: p.color }}
                    >
                      <Logo size={20} />
                    </div>
                    <div className={styles.providerInfo}>
                      <div className={styles.providerName}>{p.name}</div>
                      <div className={styles.providerFormat}>{p.format}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 1: Instructions + Upload */}
          {step === 1 && provider && (
            <div className={styles.instructions}>
              <div className={styles.instructionHeader}>
                <div className={styles.instructionProviderBadge} style={{ color: provider.color }}>
                  <provider.Logo size={18} />
                  <span className={styles.instructionProviderName}>{provider.name}</span>
                </div>
              </div>

              <div className={styles.instructionSteps}>
                {provider.instructions.map((inst, i) => (
                  <div key={i} className={styles.instructionStep}>
                    <div className={styles.instructionStepNum}>{i + 1}</div>
                    <div
                      className={styles.instructionStepText}
                      dangerouslySetInnerHTML={{ __html: inst.text }}
                    />
                  </div>
                ))}
              </div>

              {/* File upload */}
              {!file ? (
                <div
                  className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.uploadIcon}>
                    <UploadIcon />
                  </div>
                  <div className={styles.uploadTitle}>Drop your file here</div>
                  <div className={styles.uploadDesc}>
                    or <span className={styles.uploadBrowse}>browse</span> to select a file
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.zip"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className={styles.fileSelected}>
                  <div className={styles.fileIcon}>
                    <FileTextIcon />
                  </div>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    className={styles.fileRemove}
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}
            </div>
          )}

          {/* Step 2: Importing */}
          {step === 2 && (
            <div className={styles.importProgress}>
              <div className={styles.progressSpinner} />
              <div className={styles.progressText}>Importing your conversations...</div>
              <div className={styles.progressCount}>This may take a moment</div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.successTitle}>
                {importedCount} conversation{importedCount !== 1 ? 's' : ''} imported
              </div>
              <div className={styles.successDesc}>
                Your {provider?.name} conversations are now available in the Imported Chats section.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`${styles.footer} ${step > 0 && step < 3 ? styles.footerSpaced : ''}`}>
          {step === 0 && (
            <button
              className={styles.nextBtn}
              disabled={!selectedProvider}
              onClick={() => setStep(1)}
            >
              <span>Continue</span>
              <ChevronRightIcon />
            </button>
          )}

          {step === 1 && (
            <>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setStep(0);
                  setFile(null);
                  setError(null);
                }}
              >
                <ChevronLeftIcon />
                <span>Back</span>
              </button>
              <button className={styles.nextBtn} disabled={!file} onClick={handleImport}>
                <span>Import</span>
                <UploadIcon />
              </button>
            </>
          )}

          {step === 3 && (
            <button className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
