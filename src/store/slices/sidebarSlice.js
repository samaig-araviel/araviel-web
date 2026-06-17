import { createSlice } from '@reduxjs/toolkit'

const getInitialCollapsed = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) return true
  const saved = localStorage.getItem('araviel-sidebar-collapsed')
  if (saved === null) return true // Default to collapsed
  return saved === 'true'
}

const initialState = {
  collapsed: getInitialCollapsed(),
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.collapsed = !state.collapsed
      localStorage.setItem('araviel-sidebar-collapsed', state.collapsed)
    },
    setCollapsed: (state, action) => {
      state.collapsed = action.payload
      localStorage.setItem('araviel-sidebar-collapsed', action.payload)
    },
  },
})

export const { toggleSidebar, setCollapsed } = sidebarSlice.actions

export const selectSidebarCollapsed = (state) => state.sidebar.collapsed

export default sidebarSlice.reducer
