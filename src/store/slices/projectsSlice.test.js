import { describe, it, expect } from 'vitest';
import projectsReducer, {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setProjectsLoading,
  setProjectsError,
  resetProjectsState,
  selectProjects,
  selectProjectsLoading,
  selectProjectsError,
} from './projectsSlice';

describe('projectsSlice', () => {
  const initialState = { projects: [], loading: false, error: null };

  describe('initial state', () => {
    it('has empty projects, not loading, no error', () => {
      const state = projectsReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('setProjects', () => {
    it('sets the projects array', () => {
      const projects = [
        { id: '1', name: 'Project A' },
        { id: '2', name: 'Project B' },
      ];
      const state = projectsReducer(initialState, setProjects(projects));
      expect(state.projects).toEqual(projects);
    });

    it('replaces existing projects', () => {
      const prev = { ...initialState, projects: [{ id: '1', name: 'Old' }] };
      const state = projectsReducer(prev, setProjects([{ id: '2', name: 'New' }]));
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].name).toBe('New');
    });
  });

  describe('addProject', () => {
    it('adds a project to the beginning of the list', () => {
      const prev = { ...initialState, projects: [{ id: '1', name: 'Existing' }] };
      const state = projectsReducer(prev, addProject({ id: '2', name: 'New' }));
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0].name).toBe('New');
    });
  });

  describe('updateProject', () => {
    it('updates the correct project', () => {
      const prev = {
        ...initialState,
        projects: [
          { id: '1', name: 'A', description: 'Old' },
          { id: '2', name: 'B' },
        ],
      };
      const state = projectsReducer(
        prev,
        updateProject({ id: '1', updates: { description: 'Updated' } })
      );
      expect(state.projects[0].description).toBe('Updated');
      expect(state.projects[0].name).toBe('A');
    });

    it('does nothing for nonexistent project', () => {
      const prev = { ...initialState, projects: [{ id: '1', name: 'A' }] };
      const state = projectsReducer(
        prev,
        updateProject({ id: '999', updates: { name: 'X' } })
      );
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].name).toBe('A');
    });
  });

  describe('removeProject', () => {
    it('removes the project by id', () => {
      const prev = {
        ...initialState,
        projects: [
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
        ],
      };
      const state = projectsReducer(prev, removeProject('1'));
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe('2');
    });

    it('does nothing for nonexistent id', () => {
      const prev = { ...initialState, projects: [{ id: '1', name: 'A' }] };
      const state = projectsReducer(prev, removeProject('999'));
      expect(state.projects).toHaveLength(1);
    });
  });

  describe('setProjectsLoading', () => {
    it('sets loading state', () => {
      const state = projectsReducer(initialState, setProjectsLoading(true));
      expect(state.loading).toBe(true);
    });
  });

  describe('setProjectsError', () => {
    it('sets error message', () => {
      const state = projectsReducer(initialState, setProjectsError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('resetProjectsState', () => {
    it('resets to initial state', () => {
      const prev = {
        projects: [{ id: '1' }],
        loading: true,
        error: 'err',
      };
      const state = projectsReducer(prev, resetProjectsState());
      expect(state).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const rootState = {
      projects: {
        projects: [{ id: '1', name: 'Test' }],
        loading: true,
        error: 'err',
      },
    };

    it('selectProjects returns the projects array', () => {
      expect(selectProjects(rootState)).toEqual([{ id: '1', name: 'Test' }]);
    });

    it('selectProjectsLoading returns loading', () => {
      expect(selectProjectsLoading(rootState)).toBe(true);
    });

    it('selectProjectsError returns error', () => {
      expect(selectProjectsError(rootState)).toBe('err');
    });
  });
});
