'use client';

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveModal, selectProjects } from '@/store/selectors';
import { closeModal, addToast } from '@/store/slices/uiSlice';
import { createProject, updateProject, deleteProject, archiveProject, restoreProject } from '@/store/slices/projectSlice';
import { deleteChat, updateChatTitle, moveToProject } from '@/store/slices/chatSlice';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalIcon,
  Button,
  Input,
  TextArea,
} from '@/components/ui';
import { Trash2, AlertTriangle, FolderPlus, Edit3, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMOJI_OPTIONS, type ProjectFormData } from '@/types';

// Project Create/Edit Modal
const ProjectFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editProjectId?: string;
}> = ({ isOpen, onClose, editProjectId }) => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectProjects);
  const editProject = editProjectId
    ? projects.find((p) => p.id === editProjectId)
    : null;

  const [formData, setFormData] = React.useState<ProjectFormData>({
    name: '',
    description: '',
    emoji: '📁',
  });

  React.useEffect(() => {
    if (editProject) {
      setFormData({
        name: editProject.name,
        description: editProject.description || '',
        emoji: editProject.emoji,
      });
    } else {
      setFormData({ name: '', description: '', emoji: '📁' });
    }
  }, [editProject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      dispatch(addToast({ type: 'error', message: 'Project name is required' }));
      return;
    }

    if (editProjectId) {
      dispatch(updateProject({ id: editProjectId, updates: formData }));
      dispatch(addToast({ type: 'success', message: 'Project updated' }));
    } else {
      dispatch(createProject(formData));
      dispatch(addToast({ type: 'success', message: 'Project created' }));
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalIcon>
            <FolderPlus size={20} />
          </ModalIcon>
          <ModalTitle>
            {editProjectId ? 'Edit Project' : 'Create New Project'}
          </ModalTitle>
          <ModalDescription>
            {editProjectId
              ? 'Update your project details'
              : 'Create a new project to organize your conversations'}
          </ModalDescription>
        </ModalHeader>

        <ModalContent>
          {/* Emoji Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, emoji }))}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg text-xl',
                    'border transition-all duration-200',
                    formData.emoji === emoji
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-border hover:border-accent-primary/50'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Project name"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Description (optional)
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
        </ModalContent>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">
            {editProjectId ? 'Save Changes' : 'Create Project'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'project' | 'chat';
  targetId?: string;
}> = ({ isOpen, onClose, type, targetId }) => {
  const dispatch = useAppDispatch();

  const handleDelete = () => {
    if (!targetId) return;

    if (type === 'project') {
      dispatch(deleteProject(targetId));
      dispatch(addToast({ type: 'success', message: 'Project deleted' }));
    } else {
      dispatch(deleteChat(targetId));
      dispatch(addToast({ type: 'success', message: 'Chat deleted' }));
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalIcon variant="danger">
          <Trash2 size={20} />
        </ModalIcon>
        <ModalTitle>Delete {type === 'project' ? 'Project' : 'Chat'}?</ModalTitle>
        <ModalDescription>
          This action cannot be undone. This will permanently delete the{' '}
          {type === 'project' ? 'project and all its conversations' : 'conversation'}.
        </ModalDescription>
      </ModalHeader>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// Chat Rename Modal
const ChatRenameModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
}> = ({ isOpen, onClose, chatId }) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatId || !title.trim()) return;

    dispatch(updateChatTitle({ chatId, title: title.trim() }));
    dispatch(addToast({ type: 'success', message: 'Chat renamed' }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalIcon>
            <Edit3 size={20} />
          </ModalIcon>
          <ModalTitle>Rename Chat</ModalTitle>
          <ModalDescription>Enter a new name for this conversation</ModalDescription>
        </ModalHeader>

        <ModalContent>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chat title"
            autoFocus
          />
        </ModalContent>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Rename
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// Move to Project Modal
const MoveToProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
}> = ({ isOpen, onClose, chatId }) => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectProjects);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  const handleMove = () => {
    if (!chatId) return;

    dispatch(moveToProject({ chatId, projectId: selectedProjectId }));
    dispatch(
      addToast({
        type: 'success',
        message: selectedProjectId ? 'Moved to project' : 'Removed from project',
      })
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalIcon>
          <FolderPlus size={20} />
        </ModalIcon>
        <ModalTitle>Move to Project</ModalTitle>
        <ModalDescription>
          Select a project to move this conversation to
        </ModalDescription>
      </ModalHeader>

      <ModalContent>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-left transition-all duration-200',
              selectedProjectId === null
                ? 'bg-accent-primary/10 border border-accent-primary/30'
                : 'border border-border hover:border-accent-primary/30'
            )}
          >
            <span className="text-lg">📤</span>
            <span className="text-sm font-medium text-text-primary">
              No project (Recent chats)
            </span>
          </button>

          {projects
            .filter((p) => !p.archived)
            .map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'text-left transition-all duration-200',
                  selectedProjectId === project.id
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : 'border border-border hover:border-accent-primary/30'
                )}
              >
                <span className="text-lg">{project.emoji}</span>
                <span className="text-sm font-medium text-text-primary">
                  {project.name}
                </span>
              </button>
            ))}
        </div>
      </ModalContent>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleMove}>Move</Button>
      </ModalFooter>
    </Modal>
  );
};

// Main Modal Manager
const ModalManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector(selectActiveModal);

  const handleClose = () => {
    dispatch(closeModal());
  };

  return (
    <>
      {/* Project Create Modal */}
      <ProjectFormModal
        isOpen={activeModal.type === 'projectCreate'}
        onClose={handleClose}
      />

      {/* Project Edit Modal */}
      <ProjectFormModal
        isOpen={activeModal.type === 'projectEdit'}
        onClose={handleClose}
        editProjectId={activeModal.targetId}
      />

      {/* Project Delete Modal */}
      <DeleteConfirmModal
        isOpen={activeModal.type === 'projectDelete'}
        onClose={handleClose}
        type="project"
        targetId={activeModal.targetId}
      />

      {/* Chat Delete Modal */}
      <DeleteConfirmModal
        isOpen={activeModal.type === 'chatDelete'}
        onClose={handleClose}
        type="chat"
        targetId={activeModal.targetId}
      />

      {/* Chat Rename Modal */}
      <ChatRenameModal
        isOpen={activeModal.type === 'chatRename'}
        onClose={handleClose}
        chatId={activeModal.targetId}
      />

      {/* Move to Project Modal */}
      <MoveToProjectModal
        isOpen={activeModal.type === 'chatMoveToProject'}
        onClose={handleClose}
        chatId={activeModal.targetId}
      />
    </>
  );
};

export { ModalManager };
