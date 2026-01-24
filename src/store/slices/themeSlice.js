import { createSlice } from '@reduxjs/toolkit'

const getInitialTheme = () => {
  const saved = localStorage.getItem('araviel-theme')
  if (saved) return saved
  return 'system'
}

const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const initialState = {
  mode: getInitialTheme(), // 'light', 'dark', 'system'
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload
      localStorage.setItem('araviel-theme', action.payload)
    },
  },
})

export const { setTheme } = themeSlice.actions

export const selectTheme = (state) => state.theme.mode

export const selectEffectiveTheme = (state) => {
  const mode = state.theme.mode
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

export default themeSlice.reducer
