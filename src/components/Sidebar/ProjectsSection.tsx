import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { openModal } from '../../store/uiSlice';
import {
  selectActiveProjects,
  selectArchivedProjects,
  selectExpandedProjectId,
  setExpandedProject,
} from '../../store/projectSlice';
import { selectChatsByProject, setCurrentChat } from '../../store/chatSlice';
import {
  LayersIcon,
  ChevronDownIcon,
  PlusIcon,
  ArchiveIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
} from '../Icons';
import { Dropdown, DropdownItem, DropdownDivider } from '../Common';
import { formatTimeAgo } from '../../utils/formatters';
import styles from './ProjectsSection.module.css';

interface ProjectsSectionProps {
  isCollapsed: boolean;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ isCollapsed }) => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const activeProjects = useAppSelector(selectActiveProjects);
  const archivedProjects = useAppSelector(selectArchivedProjects);
  const expandedProjectId = useAppSelector(selectExpandedProjectId);

  if (isCollapsed) {
    return (
      <div className={styles.section}>
        <button className={styles.headerCollapsed}>
          <LayersIcon size={18} />
        </button>
      </div>
    );
  }

  const handleCreateProject = () => {
    dispatch(openModal({ type: 'createProject' }));
  };

  const handleProjectAction = (action: string, projectId: string) => {
    setActiveMenu(null);
    switch (action) {
      case 'rename':
        dispatch(openModal({ type: 'renameProject', data: { projectId } }));
        break;
      case 'delete':
        dispatch(openModal({ type: 'deleteProject', data: { projectId } }));
        break;
      // Add more actions as needed
    }
  };

  return (
    <div className={styles.section}>
      <button
        className={`${styles.header} ${isExpanded ? styles.active : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <LayersIcon size={18} />
        <span>Projects</span>
        <ChevronDownIcon
          size={12}
          className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}
        />
      </button>

      {isExpanded && (
        <div className={styles.content}>
          <button className={styles.newProjectBtn} onClick={handleCreateProject}>
            <PlusIcon size={16} />
            <span>New project</span>
          </button>

          <div className={styles.projectsList}>
            {activeProjects.length === 0 ? (
              <div className={styles.empty}>No projects</div>
            ) : (
              activeProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjectId === project.id}
                  onToggle={() => dispatch(setExpandedProject(project.id))}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onAction={handleProjectAction}
                />
              ))
            )}
          </div>

          {archivedProjects.length > 0 && (
            <div className={styles.archivedSection}>
              <button
                className={`${styles.archivedHeader} ${showArchived ? styles.active : ''}`}
                onClick={() => setShowArchived(!showArchived)}
              >
                <ArchiveIcon size={16} />
                <span>Archived</span>
                <span className={styles.archivedCount}>{archivedProjects.length}</span>
                <ChevronDownIcon
                  size={12}
                  className={`${styles.arrow} ${showArchived ? styles.expanded : ''}`}
                />
              </button>

              {showArchived && (
                <div className={styles.archivedList}>
                  {archivedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      isExpanded={false}
                      onToggle={() => {}}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onAction={handleProjectAction}
                      isArchived
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

interface ProjectItemProps {
  project: {
    id: string;
    name: string;
    emoji: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  onAction: (action: string, projectId: string) => void;
  isArchived?: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  isExpanded,
  onToggle,
  activeMenu,
  setActiveMenu,
  onAction,
  isArchived = false,
}) => {
  const dispatch = useAppDispatch();
  const projectChats = useAppSelector((state) => selectChatsByProject(state, project.id));
  const showMenu = activeMenu === project.id;

  return (
    <div className={`${styles.projectWrapper} ${isArchived ? styles.archived : ''}`}>
      <div className={styles.projectHeader}>
        <button
          className={`${styles.projectItem} ${isExpanded ? styles.expanded : ''}`}
          onClick={onToggle}
        >
          <span className={styles.emoji}>{project.emoji}</span>
          <span className={styles.name}>{project.name}</span>
          <ChevronDownIcon
            size={12}
            className={`${styles.projectArrow} ${isExpanded ? styles.expanded : ''}`}
          />
        </button>

        <div className={styles.menuWrapper}>
          <button
            className={styles.menuBtn}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(showMenu ? null : project.id);
            }}
          >
            <MoreVerticalIcon size={16} />
          </button>

          <Dropdown
            isOpen={showMenu}
            onClose={() => setActiveMenu(null)}
            position="bottom"
            align="end"
          >
            <DropdownItem
              icon={<EditIcon size={16} />}
              onClick={() => onAction('rename', project.id)}
            >
              Rename project
            </DropdownItem>
            {!isArchived && (
              <DropdownItem
                icon={<EyeIcon size={16} />}
                onClick={() => onAction('view', project.id)}
              >
                View project
              </DropdownItem>
            )}
            <DropdownDivider />
            <DropdownItem
              icon={<TrashIcon size={16} />}
              onClick={() => onAction('delete', project.id)}
              danger
            >
              Delete project
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {isExpanded && !isArchived && (
        <div className={styles.projectChats}>
          {projectChats.length === 0 ? (
            <div className={styles.noChats}>No conversations yet</div>
          ) : (
            projectChats.map((chat) => (
              <button
                key={chat.id}
                className={styles.chatItem}
                onClick={() => dispatch(setCurrentChat(chat.id))}
              >
                <span className={styles.chatTitle}>{chat.title}</span>
                <span className={styles.chatTime}>{formatTimeAgo(new Date(chat.updatedAt))}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
