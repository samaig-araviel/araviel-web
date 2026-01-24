import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectInputValue, selectMode, setInputValue, setMode } from '../../store/slices/chatSlice'
import { SendIcon, CodeIcon, PenIcon, CloseIcon } from '../Icons'
import styles from './MainContent.module.css'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

const codePrompts = [
  { id: 1, title: 'Debug my code', description: 'Find and fix issues in your code' },
  { id: 2, title: 'Write a function', description: 'Generate code for specific tasks' },
  { id: 3, title: 'Explain this code', description: 'Get step-by-step explanations' },
  { id: 4, title: 'Optimize performance', description: 'Improve code efficiency' },
  { id: 5, title: 'Convert code', description: 'Transform between languages' },
]

const writePrompts = [
  { id: 1, title: 'Draft an email', description: 'Professional communication' },
  { id: 2, title: 'Summarize content', description: 'Condense long text' },
  { id: 3, title: 'Create marketing copy', description: 'Engaging promotional content' },
  { id: 4, title: 'Write documentation', description: 'Technical guides and docs' },
  { id: 5, title: 'Edit and refine', description: 'Polish your writing' },
]

export default function MainContent() {
  const dispatch = useDispatch()
  const inputValue = useSelector(selectInputValue)
  const mode = useSelector(selectMode)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const textareaRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
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

  const currentPrompts = activeDropdown === 'code' ? codePrompts : writePrompts
  const dropdownTitle = activeDropdown === 'code' ? 'Code' : 'Write'
  const DropdownIcon = activeDropdown === 'code' ? CodeIcon : PenIcon

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>What can I help you orchestrate today?</p>

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

        <div className={styles.actionButtonsWrapper} ref={dropdownRef}>
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionBtn} ${activeDropdown === 'code' ? styles.activeAction : ''}`}
              onClick={() => handleModeClick('code')}
            >
              <CodeIcon />
              <span>Code</span>
            </button>
            <button
              className={`${styles.actionBtn} ${activeDropdown === 'write' ? styles.activeAction : ''}`}
              onClick={() => handleModeClick('write')}
            >
              <PenIcon />
              <span>Write</span>
            </button>
          </div>

          {activeDropdown && (
            <div className={styles.promptsDropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitleWrapper}>
                  <span className={styles.dropdownIcon}><DropdownIcon /></span>
                  <span className={styles.dropdownTitle}>{dropdownTitle}</span>
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
                {currentPrompts.map((item) => (
                  <button
                    key={item.id}
                    className={styles.promptItem}
                    onClick={() => handlePromptSelect(item.title)}
                  >
                    <span className={styles.promptTitle}>{item.title}</span>
                    <span className={styles.promptDescription}>{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
