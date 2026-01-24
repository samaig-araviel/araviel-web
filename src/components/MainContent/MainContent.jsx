import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectInputValue, selectMode, setInputValue, setMode, createNewChat } from '../../store/slices/chatSlice'
import { SendIcon, CodeIcon, PenIcon, CloseIcon, SearchIcon, ChartIcon, SparkleIcon, BookIcon, NewChatIcon } from '../Icons'
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
      'Debug my code',
      'Write a function',
      'Explain this code',
      'Optimize performance',
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      'Draft an email',
      'Summarize content',
      'Create marketing copy',
      'Write documentation',
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      'Find information on a topic',
      'Compare alternatives',
      'Analyze market trends',
      'Summarize findings',
    ],
  },
  analyze: {
    title: 'Analyze',
    icon: ChartIcon,
    items: [
      'Review this data',
      'Find patterns',
      'Generate insights',
      'Create a report',
    ],
  },
  create: {
    title: 'Create',
    icon: SparkleIcon,
    items: [
      'Generate ideas',
      'Design a solution',
      'Build a prototype',
      'Create content',
    ],
  },
  learn: {
    title: 'Learn',
    icon: BookIcon,
    items: [
      'Explain a concept',
      'Teach me about this',
      'Break down this topic',
      'Quiz me on this',
    ],
  },
}

const quickPromptKeys = ['code', 'write', 'research', 'analyze', 'create', 'learn']

export default function MainContent() {
  const dispatch = useDispatch()
  const inputValue = useSelector(selectInputValue)
  const mode = useSelector(selectMode)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const textareaRef = useRef(null)
  const inputContainerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const clickedOnQuickPrompt = e.target.closest(`.${styles.actionBtn}`)
        if (!clickedOnQuickPrompt) {
          setActiveDropdown(null)
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
      dispatch(setMode(newMode))
    }
  }

  const handlePromptSelect = (title) => {
    dispatch(setInputValue(title + ' '))
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

  const currentPromptData = activeDropdown ? promptsData[activeDropdown] : null

  const handleNewChat = () => {
    dispatch(createNewChat())
    dispatch(setInputValue(''))
    setActiveDropdown(null)
  }

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

        <div className={styles.inputSection} ref={inputContainerRef}>
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
                <button type="button" className={styles.modeSelector}>
                  Auto
                </button>
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
                {currentPromptData.items.map((item, index) => (
                  <button
                    key={index}
                    className={styles.promptItem}
                    onClick={() => handlePromptSelect(item)}
                  >
                    {item}
                  </button>
                ))}
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
