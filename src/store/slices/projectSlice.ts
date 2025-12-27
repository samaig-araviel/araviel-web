import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectFormData,
  Category,
  ProjectState,
} from '@/types';
import { DEFAULT_CATEGORIES } from '@/types';

const initialState: ProjectState = {
  projects: [],
  categories: [...DEFAULT_CATEGORIES],
  currentProjectId: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Create a new project
    createProject: (state, action: PayloadAction<ProjectFormData>) => {
      const newProject: Project = {
        id: uuidv4(),
        ...action.payload,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.projects.unshift(newProject);
    },

    // Update project
    updateProject: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Project> }>
    ) => {
      const { id, updates } = action.payload;
      const projectIndex = state.projects.findIndex((p) => p.id === id);
      if (projectIndex !== -1) {
        const project = state.projects[projectIndex];
        if (project) {
          state.projects[projectIndex] = {
            ...project,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    },

    // Rename project
    renameProject: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      const { id, name } = action.payload;
      const project = state.projects.find((p) => p.id === id);
      if (project) {
        project.name = name;
        project.updatedAt = new Date().toISOString();
      }
    },

    // Archive project
    archiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find((p) => p.id === action.payload);
      if (project) {
        project.archived = true;
        project.updatedAt = new Date().toISOString();
      }
    },

    // Unarchive project
    unarchiveProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find((p) => p.id === action.payload);
      if (project) {
        project.archived = false;
        project.updatedAt = new Date().toISOString();
      }
    },

    // Delete project
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      if (state.currentProjectId === action.payload) {
        state.currentProjectId = null;
      }
    },

    // Set current project
    setCurrentProject: (state, action: PayloadAction<string | null>) => {
      state.currentProjectId = action.payload;
    },

    // Add custom category
    addCategory: (
      state,
      action: PayloadAction<{ name: string; emoji: string }>
    ) => {
      const { name, emoji } = action.payload;
      const newCategory: Category = {
        id: uuidv4(),
        name,
        emoji,
        isCustom: true,
      };
      state.categories.push(newCategory);
    },

    // Remove custom category
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (c) => c.id !== action.payload || !c.isCustom
      );
    },

    // Load projects from storage
    loadProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },

    // Load categories from storage
    loadCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
  },
});

export const {
  createProject,
  updateProject,
  renameProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  setCurrentProject,
  addCategory,
  removeCategory,
  loadProjects,
  loadCategories,
} = projectSlice.actions;

export default projectSlice.reducer;
