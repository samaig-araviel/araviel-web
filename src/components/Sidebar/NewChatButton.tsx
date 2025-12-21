import React from 'react';
import { useAppDispatch } from '../../store';
import { clearCurrentChat } from '../../store/chatSlice';
import { setCurrentProject } from '../../store/projectSlice';
import { ChatIcon } from '../Icons';
import styles from './NewChatButton.module.css';

interface NewChatButtonProps {
  isCollapsed: boolean;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ isCollapsed }) => {
  const dispatch = useAppDispatch();

  const handleNewChat = () => {
    dispatch(clearCurrentChat());
    dispatch(setCurrentProject(null));
  };

  return (
    <button
      className={`${styles.button} ${isCollapsed ? styles.collapsed : ''}`}
      onClick={handleNewChat}
    >
      <ChatIcon size={16} />
      {!isCollapsed && <span>New chat</span>}
    </button>
  );
};
