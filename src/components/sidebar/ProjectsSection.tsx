'use client';

import * as React from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit3,
  Eye,
  Archive,
  Trash2,
  ArchiveRestore,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectActiveProjects,
  selectArchivedProjects,
  selectSidebarOpen,
  selectProjectsDropdownOpen,
  selectArchivedDropdownOpen,
  selectChatsByProject,
} from '@/store/selectors';
import {
  toggleProjectsDropdown,
  toggleArchivedDropdown,
  openModal,
  openDropdown,
  closeAllDropdowns,
} from '@/store/slices/uiSlice';
import { setCurrentProject } from '@/store/slices/projectSlice';
import { setCurrentChat } from '@/store/slices/chatSlice';
import type { Project } from '@/types';
import type { RootState } from '@/store';

// Project Chat Item
interface ProjectChatItemProps {
  chatId: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  onSelect: () => void;
}

const ProjectChatItem: React.FC<ProjectChatItemProps> = ({
  title,
  updatedAt,
  isActive,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md',
        'text-left transition-all duration-200',
        'border border-transparent',
        isActive
          ? 'bg-gradient-to-br from-accent-primary/15 to-accent-hover/10 border-accent-primary/30'
          : 'hover:bg-background-tertiary hover:border-border'
      )}
    >
      <span className="text-xs font-medium text-text-primary truncate">
        {title}
      </span>
      <span className="text-[10px] text-text-tertiary">{updatedAt}</span>
    </button>
  );
};

// Project Item
interface ProjectItemProps {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isExpanded,
  onToggle,
  onMenuClick,
}) => {
  const dispatch = useAppDispatch();
  const currentChatId = useAppSelector((state: RootState) => state.chat.currentChatId);
  const chats = useAppSelector((state: RootState) =>
    selectChatsByProject(state, project.id)
  );

  const handleChatSelect = (chatId: string) => {
    dispatch(setCurrentChat(chatId));
  };

  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className={cn(
            'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg',
            'text-text-secondary text-sm font-medium',
            'transition-all duration-200',
            'hover:bg-background-tertiary hover:text-text-primary',
            'border border-transparent',
            isExpanded && 'text-text-primary'
          )}
        >
          <span className="text-sm flex-shrink-0">{project.emoji}</span>
          <span className="flex-1 truncate text-left">{project.name}</span>
          <ChevronDown
            size={12}
            className={cn(
              'flex-shrink-0 text-text-secondary transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
        <button
          onClick={onMenuClick}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md',
            'text-text-secondary opacity-0 group-hover:opacity-100',
            'hover:bg-background-tertiary hover:text-text-primary',
            'transition-all duration-200'
          )}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="pl-6 pt-1 pb-2">
          {chats.length === 0 ? (
            <p className="text-[11px] text-text-tertiary italic py-3 text-center">
              No conversations yet
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {chats.map((chat) => (
                <ProjectChatItem
                  key={chat.id}
                  chatId={chat.id}
                  title={chat.title}
                  updatedAt={new Date(chat.updatedAt).toLocaleDateString()}
                  isActive={chat.id === currentChatId}
                  onSelect={() => handleChatSelect(chat.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Projects Section
const ProjectsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const isProjectsOpen = useAppSelector(selectProjectsDropdownOpen);
  const isArchivedOpen = useAppSelector(selectArchivedDropdownOpen);
  const activeProjects = useAppSelector(selectActiveProjects);
  const archivedProjects = useAppSelector(selectArchivedProjects);

  const [expandedProjectId, setExpandedProjectId] = React.useState<
    string | null
  >(null);

  const handleToggleProjects = () => {
    dispatch(toggleProjectsDropdown());
  };

  const handleToggleArchived = () => {
    dispatch(toggleArchivedDropdown());
  };

  const handleNewProject = () => {
    dispatch(openModal({ type: 'projectCreate' }));
  };

  const handleProjectMenuClick = (
    e: React.MouseEvent,
    projectId: string,
    isArchived: boolean
  ) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dispatch(
      openDropdown({
        type: 'projectMenu',
        targetId: projectId,
        position: { top: rect.bottom + 4, left: rect.left },
      })
    );
  };

  if (!sidebarOpen) {
    return (
      <div className="px-1.5 mb-2">
        <button
          onClick={handleToggleProjects}
          className={cn(
            'w-[38px] h-[38px] flex items-center justify-center rounded-lg',
            'text-text-secondary hover:text-text-primary',
            'hover:bg-background-tertiary transition-colors'
          )}
        >
          <Layers size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 mb-2">
      {/* Projects Header */}
      <button
        onClick={handleToggleProjects}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg',
          'text-text-secondary text-sm font-medium',
          'transition-all duration-200',
          'hover:bg-background-tertiary hover:text-text-primary',
          isProjectsOpen && 'text-text-primary'
        )}
      >
        <Layers size={18} />
        <span className="flex-1 text-left">Projects</span>
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200',
            isProjectsOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Projects Dropdown */}
      {isProjectsOpen && (
        <div className="pt-1">
          {/* New Project Button */}
          <button
            onClick={handleNewProject}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg',
              'text-text-primary text-sm font-medium',
              'border border-border border-dashed',
              'transition-all duration-200',
              'hover:bg-background-tertiary hover:border-accent-primary'
            )}
          >
            <Plus size={16} />
            <span>New project</span>
          </button>

          {/* Projects List */}
          {activeProjects.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-3">
              No projects
            </p>
          ) : (
            <div className="group">
              {activeProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjectId === project.id}
                  onToggle={() =>
                    setExpandedProjectId(
                      expandedProjectId === project.id ? null : project.id
                    )
                  }
                  onMenuClick={(e) =>
                    handleProjectMenuClick(e, project.id, false)
                  }
                />
              ))}
            </div>
          )}

          {/* Archived Section */}
          {archivedProjects.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <button
                onClick={handleToggleArchived}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
                  'text-text-tertiary text-xs font-semibold uppercase tracking-wide',
                  'transition-all duration-200',
                  'hover:bg-background-tertiary hover:text-text-secondary'
                )}
              >
                <Archive size={14} />
                <span>Archived</span>
                <span className="ml-auto px-1.5 py-0.5 bg-background-tertiary rounded-full text-[10px]">
                  {archivedProjects.length}
                </span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'transition-transform duration-200',
                    isArchivedOpen && 'rotate-180'
                  )}
                />
              </button>

              {isArchivedOpen && (
                <div className="mt-1 group">
                  {archivedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isExpanded={expandedProjectId === project.id}
                      onToggle={() =>
                        setExpandedProjectId(
                          expandedProjectId === project.id ? null : project.id
                        )
                      }
                      onMenuClick={(e) =>
                        handleProjectMenuClick(e, project.id, true)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ProjectsSection };
