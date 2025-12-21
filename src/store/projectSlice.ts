import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ModelType, ProjectCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  customCategories: ProjectCategory[];
  expandedProjectId: string | null;
}

const loadProjectsFromStorage = (): Project[] => {
  try {
    const stored = localStorage.getItem('araviel_projects');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadCurrentProjectFromStorage = (): string | null => {
  try {
    const stored = localStorage.getItem('araviel_active_state');
    if (stored) {
      const state = JSON.parse(stored);
      return state.projectId || null;
    }
    return null;
  } catch {
    return null;
  }
};

const loadCustomCategoriesFromStorage = (): ProjectCategory[] => {
  try {
    const stored = localStorage.getItem('araviel_custom_categories');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveProjectsToStorage = (projects: Project[]) => {
  localStorage.setItem('araviel_projects', JSON.stringify(projects));
};

const saveActiveState = (chatId: string | null, projectId: string | null) => {
  localStorage.setItem('araviel_active_state', JSON.stringify({ chatId, projectId }));
};

const saveCustomCategoriesToStorage = (categories: ProjectCategory[]) => {
  localStorage.setItem('araviel_custom_categories', JSON.stringify(categories));
};

const initialState: ProjectState = {
  projects: loadProjectsFromStorage(),
  currentProjectId: loadCurrentProjectFromStorage(),
  customCategories: loadCustomCategoriesFromStorage(),
  expandedProjectId: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<{
      name: string;
      description?: string;
      category?: string;
    }>) => {
      const now = new Date().toISOString();
      const newProject: Project = {
        id: uuidv4(),
        name: action.payload.name,
        category: action.payload.category || 'Personal',
        emoji: '📁',
        description: action.payload.description || '',
        instructions: '',
        model: 'Auto',
        webEnabled: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      state.projects.unshift(newProject);
      saveProjectsToStorage(state.projects);
    },

    createProject: (state, action: PayloadAction<{
      name: string;
      category: string;
      emoji: string;
      description: string;
      instructions: string;
      model: ModelType;
      webEnabled: boolean;
    }>) => {
      const now = new Date().toISOString();
      const newProject: Project = {
        id: uuidv4(),
        name: action.payload.name,
        category: action.payload.category,
        emoji: action.payload.emoji,
        description: action.payload.description,
        instructions: action.payload.instructions,
        model: action.payload.model,
        webEnabled: action.payload.webEnabled,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };
      state.projects.unshift(newProject);
      saveProjectsToStorage(state.projects);
    },

    updateProject: (state, action: PayloadAction<{
      id: string;
      updates: Partial<Omit<Project, 'id' | 'createdAt'>>;
    }>) => {
      const project = state.projects.find(p => p.id === action.payload.id);
      if (project) {
        Object.assign(project, action.payload.updates);
        project.updatedAt = new Date().toISOString();
        saveProjectsToStorage(state.projects);
      }
    },

    renameProject: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const project = state.projects.find(p => p.id === action.payload.id);
      if (project) {
        project.name = action.payload.name;
        project.updatedAt = new Date().toISOString();
        saveProjectsToStorage(state.projects);
      }
    },

    archiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        project.archived = true;
        project.updatedAt = new Date().toISOString();
        saveProjectsToStorage(state.projects);
      }
    },

    unarchiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        project.archived = false;
        project.updatedAt = new Date().toISOString();
        saveProjectsToStorage(state.projects);
      }
    },

    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      if (state.currentProjectId === action.payload) {
        state.currentProjectId = null;
        saveActiveState(null, null);
      }
      saveProjectsToStorage(state.projects);
    },

    setCurrentProject: (state, action: PayloadAction<string | null>) => {
      state.currentProjectId = action.payload;
      // Get current chat ID from localStorage
      const stored = localStorage.getItem('araviel_active_state');
      const activeState = stored ? JSON.parse(stored) : {};
      saveActiveState(activeState.chatId || null, action.payload);
    },

    setExpandedProject: (state, action: PayloadAction<string | null>) => {
      state.expandedProjectId = state.expandedProjectId === action.payload ? null : action.payload;
    },

    addCustomCategory: (state, action: PayloadAction<ProjectCategory>) => {
      state.customCategories.push({ ...action.payload, isCustom: true });
      saveCustomCategoriesToStorage(state.customCategories);
    },

    removeCustomCategory: (state, action: PayloadAction<string>) => {
      state.customCategories = state.customCategories.filter(c => c.name !== action.payload);
      saveCustomCategoriesToStorage(state.customCategories);
    },
  },
});

export const {
  addProject,
  createProject,
  updateProject,
  renameProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  setCurrentProject,
  setExpandedProject,
  addCustomCategory,
  removeCustomCategory,
} = projectSlice.actions;

export default projectSlice.reducer;

// Selectors
export const selectProjects = (state: { project: ProjectState }) => state.project.projects;
export const selectActiveProjects = (state: { project: ProjectState }) =>
  state.project.projects.filter(p => !p.archived);
export const selectArchivedProjects = (state: { project: ProjectState }) =>
  state.project.projects.filter(p => p.archived);
export const selectCurrentProject = (state: { project: ProjectState }) =>
  state.project.projects.find(p => p.id === state.project.currentProjectId);
export const selectCurrentProjectId = (state: { project: ProjectState }) =>
  state.project.currentProjectId;
export const selectExpandedProjectId = (state: { project: ProjectState }) =>
  state.project.expandedProjectId;
export const selectAllCategories = (state: { project: ProjectState }) =>
  [...DEFAULT_CATEGORIES, ...state.project.customCategories];
export const selectProjectById = (state: { project: ProjectState }, id: string) =>
  state.project.projects.find(p => p.id === id);
