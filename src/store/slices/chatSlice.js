import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  messages: [],
  inputValue: '',
  mode: 'auto', // 'auto', 'code', 'write'
  recentChats: [
    { id: '1', title: 'Project Titan Strategy' },
    { id: '2', title: 'React Performance' },
  ],
  currentChatId: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInputValue: (state, action) => {
      state.inputValue = action.payload
    },
    setMode: (state, action) => {
      state.mode = action.payload
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    clearMessages: (state) => {
      state.messages = []
    },
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload
    },
    createNewChat: (state) => {
      state.currentChatId = null
      state.messages = []
      state.inputValue = ''
    },
  },
})

export const {
  setInputValue,
  setMode,
  addMessage,
  clearMessages,
  setCurrentChat,
  createNewChat,
} = chatSlice.actions

export const selectInputValue = (state) => state.chat.inputValue
export const selectMode = (state) => state.chat.mode
export const selectMessages = (state) => state.chat.messages
export const selectRecentChats = (state) => state.chat.recentChats
export const selectCurrentChatId = (state) => state.chat.currentChatId

export default chatSlice.reducer
