import { createSlice } from '@reduxjs/toolkit'

const getInitialCollapsed = () => {
  const saved = localStorage.getItem('araviel-sidebar-collapsed')
  return saved === 'true'
}

const initialState = {
  collapsed: getInitialCollapsed(),
  activeItem: 'home',
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
    setActiveItem: (state, action) => {
      state.activeItem = action.payload
    },
  },
})

export const { toggleSidebar, setCollapsed, setActiveItem } = sidebarSlice.actions

export const selectSidebarCollapsed = (state) => state.sidebar.collapsed
export const selectActiveItem = (state) => state.sidebar.activeItem

export default sidebarSlice.reducer
