import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

// ============================================
// Chat Selectors
// ============================================

export const selectChats = (state: RootState) => state.chat.chats;
export const selectCurrentChatId = (state: RootState) =>
  state.chat.currentChatId;
export const selectIsStreaming = (state: RootState) => state.chat.isStreaming;
export const selectSelectedModel = (state: RootState) =>
  state.chat.selectedModel;
export const selectStreamingContent = (state: RootState) =>
  state.chat.streamingContent;

export const selectCurrentChat = createSelector(
  [selectChats, selectCurrentChatId],
  (chats, currentChatId) => {
    if (!currentChatId) {return null;}
    return chats.find((chat) => chat.id === currentChatId) ?? null;
  }
);

export const selectCurrentChatMessages = createSelector(
  [selectCurrentChat],
  (chat) => chat?.messages ?? []
);

export const selectRecentChats = createSelector([selectChats], (chats) =>
  [...chats].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
);

export const selectChatsByProject = createSelector(
  [selectChats, (_state: RootState, projectId: string | null) => projectId],
  (chats, projectId) => {
    if (!projectId) {return [];}
    return chats
      .filter((chat) => chat.projectId === projectId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
);

export const selectOrphanChats = createSelector([selectChats], (chats) =>
  chats
    .filter((chat) => !chat.projectId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
);

// ============================================
// Project Selectors
// ============================================

export const selectProjects = (state: RootState) => state.project.projects;
export const selectCategories = (state: RootState) => state.project.categories;
export const selectCurrentProjectId = (state: RootState) =>
  state.project.currentProjectId;

export const selectActiveProjects = createSelector(
  [selectProjects],
  (projects) => projects.filter((p) => !p.archived)
);

export const selectArchivedProjects = createSelector(
  [selectProjects],
  (projects) => projects.filter((p) => p.archived)
);

export const selectCurrentProject = createSelector(
  [selectProjects, selectCurrentProjectId],
  (projects, currentProjectId) => {
    if (!currentProjectId) {return null;}
    return projects.find((p) => p.id === currentProjectId) ?? null;
  }
);

export const selectProjectById = createSelector(
  [selectProjects, (_state: RootState, projectId: string) => projectId],
  (projects, projectId) => projects.find((p) => p.id === projectId) ?? null
);

export const selectCustomCategories = createSelector(
  [selectCategories],
  (categories) => categories.filter((c) => c.isCustom)
);

// ============================================
// UI Selectors
// ============================================

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectProjectsDropdownOpen = (state: RootState) =>
  state.ui.projectsDropdownOpen;
export const selectRecentsDropdownOpen = (state: RootState) =>
  state.ui.recentsDropdownOpen;
export const selectArchivedDropdownOpen = (state: RootState) =>
  state.ui.archivedDropdownOpen;
export const selectActiveModal = (state: RootState) => state.ui.activeModal;
export const selectActiveDropdown = (state: RootState) =>
  state.ui.activeDropdown;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectIsMobile = (state: RootState) => state.ui.isMobile;
export const selectScrolledFromBottom = (state: RootState) =>
  state.ui.scrolledFromBottom;

export const selectIsModalOpen = createSelector(
  [selectActiveModal],
  (modal) => modal.type !== null
);

export const selectIsDropdownOpen = createSelector(
  [selectActiveDropdown],
  (dropdown) => dropdown.type !== null
);

// ============================================
// User Selectors
// ============================================

export const selectUser = (state: RootState) => state.user.user;
export const selectUserSettings = (state: RootState) => state.user.settings;
export const selectIsAuthenticated = (state: RootState) =>
  state.user.isAuthenticated;

export const selectDefaultModel = createSelector(
  [selectUserSettings],
  (settings) => settings.defaultModel
);

export const selectFileAttachmentsEnabled = createSelector(
  [selectUserSettings],
  (settings) => settings.enableFileAttachments
);

export const selectWebSearchEnabled = createSelector(
  [selectUserSettings],
  (settings) => settings.enableWebSearch
);

export const selectMaxAttachments = createSelector(
  [selectUserSettings],
  (settings) => settings.maxAttachments
);

export const selectMaxFileSize = createSelector(
  [selectUserSettings],
  (settings) => settings.maxFileSize
);
