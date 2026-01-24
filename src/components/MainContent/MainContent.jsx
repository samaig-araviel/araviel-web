import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectInputValue, selectMode, setInputValue, setMode, createNewChat } from '../../store/slices/chatSlice'
import {
  SendIcon,
  CodeIcon,
  PenIcon,
  CloseIcon,
  SearchIcon,
  ChartIcon,
  SparkleIcon,
  BookIcon,
  NewChatIcon,
  AttachIcon,
  CameraIcon,
  PhotoIcon,
  FileIcon,
  BugIcon,
  LightbulbIcon,
  ZapIcon,
  RefreshIcon,
  MailIcon,
  FileTextIcon,
  CopyIcon,
  TargetIcon,
  TrendingUpIcon,
  ClipboardIcon,
  EyeIcon,
  PuzzleIcon,
  LayersIcon,
  HelpCircleIcon,
} from '../Icons'
import styles from './MainContent.module.css'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

const promptsData = {
  code: {
    title: 'Code',
    icon: CodeIcon,
    items: [
      { text: 'Debug my code', icon: BugIcon },
      { text: 'Write a function', icon: CodeIcon },
      { text: 'Explain this code', icon: LightbulbIcon },
      { text: 'Optimize performance', icon: ZapIcon },
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      { text: 'Draft an email', icon: MailIcon },
      { text: 'Summarize content', icon: FileTextIcon },
      { text: 'Create marketing copy', icon: CopyIcon },
      { text: 'Write documentation', icon: ClipboardIcon },
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      { text: 'Find information', icon: SearchIcon },
      { text: 'Compare alternatives', icon: LayersIcon },
      { text: 'Analyze market trends', icon: TrendingUpIcon },
      { text: 'Summarize findings', icon: ClipboardIcon },
    ],
  },
  analyze: {
    title: 'Analyze',
    icon: ChartIcon,
    items: [
      { text: 'Review this data', icon: EyeIcon },
      { text: 'Find patterns', icon: PuzzleIcon },
      { text: 'Generate insights', icon: LightbulbIcon },
      { text: 'Create a report', icon: ClipboardIcon },
    ],
  },
  create: {
    title: 'Create',
    icon: SparkleIcon,
    items: [
      { text: 'Generate ideas', icon: LightbulbIcon },
      { text: 'Design a solution', icon: PuzzleIcon },
      { text: 'Build a prototype', icon: LayersIcon },
      { text: 'Create content', icon: SparkleIcon },
    ],
  },
  learn: {
    title: 'Learn',
    icon: BookIcon,
    items: [
      { text: 'Explain a concept', icon: LightbulbIcon },
      { text: 'Teach me about this', icon: BookIcon },
      { text: 'Break down this topic', icon: LayersIcon },
      { text: 'Quiz me on this', icon: HelpCircleIcon },
    ],
  },
}

const attachOptions = [
  { id: 'camera', label: 'Camera', icon: CameraIcon },
  { id: 'photo', label: 'Photo', icon: PhotoIcon },
  { id: 'file', label: 'File', icon: FileIcon },
]

const quickPromptKeys = ['code', 'write', 'research', 'analyze', 'create', 'learn']

export default function MainContent() {
  const dispatch = useDispatch()
  const inputValue = useSelector(selectInputValue)
  const mode = useSelector(selectMode)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [showAttachDropdown, setShowAttachDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const attachDropdownRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const clickedOnQuickPrompt = e.target.closest(`.${styles.actionBtn}`)
        if (!clickedOnQuickPrompt) {
          setActiveDropdown(null)
        }
      }
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target)) {
        const clickedOnAttach = e.target.closest(`.${styles.attachBtn}`)
        if (!clickedOnAttach) {
          setShowAttachDropdown(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null)
        setShowAttachDropdown(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleInputChange = (e) => {
    dispatch(setInputValue(e.target.value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    console.log('Submitting:', inputValue, 'Mode:', mode)
    dispatch(setInputValue(''))
  }

  const handleModeClick = (newMode) => {
    if (activeDropdown === newMode) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown(newMode)
      setShowAttachDropdown(false)
      dispatch(setMode(newMode))
    }
  }

  const handlePromptSelect = (text) => {
    dispatch(setInputValue(text + ' '))
    setActiveDropdown(null)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleCloseDropdown = () => {
    setActiveDropdown(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleNewChat = () => {
    dispatch(createNewChat())
    dispatch(setInputValue(''))
    setActiveDropdown(null)
  }

  const handleAttachClick = () => {
    setShowAttachDropdown(!showAttachDropdown)
    setActiveDropdown(null)
  }

  const handleAttachOptionClick = (optionId) => {
    console.log('Attach option selected:', optionId)
    setShowAttachDropdown(false)
  }

  const currentPromptData = activeDropdown ? promptsData[activeDropdown] : null

  return (
    <main className={styles.main}>
      <button
        className={styles.newChatBtn}
        onClick={handleNewChat}
        title="New Chat"
        aria-label="Start new chat"
      >
        <NewChatIcon />
      </button>
      <div className={styles.container}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>What can I help you orchestrate today?</p>

        <div className={styles.inputSection}>
          <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.input}
                placeholder="Ask anything..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className={styles.inputActions}>
                <div className={styles.leftActions}>
                  <button
                    type="button"
                    className={`${styles.attachBtn} ${showAttachDropdown ? styles.active : ''}`}
                    onClick={handleAttachClick}
                    aria-label="Attach file"
                  >
                    <AttachIcon />
                  </button>
                  {showAttachDropdown && (
                    <div className={styles.attachDropdown} ref={attachDropdownRef}>
                      {attachOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.id}
                            className={styles.attachOption}
                            onClick={() => handleAttachOptionClick(option.id)}
                          >
                            <Icon />
                            <span>{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <button type="button" className={styles.modeSelector}>
                    Auto
                  </button>
                </div>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${inputValue.trim() ? styles.active : ''}`}
                  disabled={!inputValue.trim()}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </form>

          {activeDropdown && currentPromptData && (
            <div className={styles.promptsDropdown} ref={dropdownRef}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitleWrapper}>
                  <currentPromptData.icon />
                  <span className={styles.dropdownTitle}>{currentPromptData.title}</span>
                </div>
                <button
                  className={styles.dropdownClose}
                  onClick={handleCloseDropdown}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className={styles.promptsList}>
                {currentPromptData.items.map((item, index) => {
                  const ItemIcon = item.icon
                  return (
                    <button
                      key={index}
                      className={styles.promptItem}
                      onClick={() => handlePromptSelect(item.text)}
                    >
                      <span className={styles.promptItemIcon}>
                        <ItemIcon />
                      </span>
                      <span>{item.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          {quickPromptKeys.map((key) => {
            const data = promptsData[key]
            const Icon = data.icon
            return (
              <button
                key={key}
                className={`${styles.actionBtn} ${activeDropdown === key ? styles.activeAction : ''}`}
                onClick={() => handleModeClick(key)}
              >
                <Icon />
                <span>{data.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
