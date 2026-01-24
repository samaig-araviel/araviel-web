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

export default function MainContent() {
  const dispatch = useDispatch()
  const inputValue = useSelector(selectInputValue)
  const mode = useSelector(selectMode)

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

  const handleModeChange = (newMode) => {
    dispatch(setMode(newMode))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>What can I help you orchestrate today?</p>

        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <textarea
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

        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${mode === 'code' ? styles.activeAction : ''}`}
            onClick={() => handleModeChange('code')}
          >
            <CodeIcon />
            <span>Code</span>
          </button>
          <button
            className={`${styles.actionBtn} ${mode === 'write' ? styles.activeAction : ''}`}
            onClick={() => handleModeChange('write')}
          >
            <PenIcon />
            <span>Write</span>
          </button>
        </div>
      </div>
    </main>
  )
}
