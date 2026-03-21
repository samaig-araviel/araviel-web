import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  projects: [],
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    addProject: (state, action) => {
      state.projects.unshift(action.payload);
    },
    updateProject: (state, action) => {
      const { id, updates } = action.payload;
      const idx = state.projects.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.projects[idx] = { ...state.projects[idx], ...updates };
      }
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
    setProjectsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setProjectsError: (state, action) => {
      state.error = action.payload;
    },
    resetProjectsState: () => initialState,
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setProjectsLoading,
  setProjectsError,
  resetProjectsState,
} = projectsSlice.actions;

export const selectProjects = (state) => state.projects.projects;
export const selectProjectsLoading = (state) => state.projects.loading;
export const selectProjectsError = (state) => state.projects.error;

export default projectsSlice.reducer;
