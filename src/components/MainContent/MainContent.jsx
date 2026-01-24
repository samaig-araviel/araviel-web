import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectInputValue, selectMode, setInputValue, setMode } from '../../store/slices/chatSlice'
import { SendIcon, CodeIcon, PenIcon } from '../Icons'
import styles from './MainContent.module.css'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

const codePrompts = [
  { id: 1, title: 'Debug my code', prompt: 'Help me debug this code and find the issue:' },
  { id: 2, title: 'Write a function', prompt: 'Write a function that' },
  { id: 3, title: 'Explain this code', prompt: 'Explain what this code does step by step:' },
]

const writePrompts = [
  { id: 1, title: 'Write an email', prompt: 'Write a professional email about' },
  { id: 2, title: 'Summarize text', prompt: 'Summarize the following text:' },
  { id: 3, title: 'Create content', prompt: 'Create engaging content about' },
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

  const handleInputChange = (e) => {
    dispatch(setInputValue(e.target.value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    // Handle submission - will call backend API
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

  const handlePromptSelect = (prompt) => {
    dispatch(setInputValue(prompt))
    setActiveDropdown(null)
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const currentPrompts = activeDropdown === 'code' ? codePrompts : writePrompts

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
              className={`${styles.actionBtn} ${mode === 'code' || activeDropdown === 'code' ? styles.activeAction : ''}`}
              onClick={() => handleModeClick('code')}
            >
              <CodeIcon />
              <span>Code</span>
            </button>
            <button
              className={`${styles.actionBtn} ${mode === 'write' || activeDropdown === 'write' ? styles.activeAction : ''}`}
              onClick={() => handleModeClick('write')}
            >
              <PenIcon />
              <span>Write</span>
            </button>
          </div>

          {activeDropdown && (
            <div className={styles.promptsDropdown}>
              <div className={styles.promptsList}>
                {currentPrompts.map((item) => (
                  <button
                    key={item.id}
                    className={styles.promptItem}
                    onClick={() => handlePromptSelect(item.prompt)}
                  >
                    <span className={styles.promptTitle}>{item.title}</span>
                    <span className={styles.promptPreview}>{item.prompt}</span>
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
