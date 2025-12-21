import React from 'react';
import { useAppSelector } from '../../store';
import { selectCurrentChat } from '../../store/chatSlice';
import TopBar from './TopBar';
import WelcomeScreen from './WelcomeScreen';
import ChatView from './ChatView';
import styles from './MainContent.module.css';

const MainContent: React.FC = () => {
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const currentChat = useAppSelector(selectCurrentChat);

  const mainClasses = [
    styles.main,
    !sidebarOpen ? styles.sidebarCollapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={mainClasses}>
      <TopBar />
      {currentChat ? <ChatView /> : <WelcomeScreen />}
    </main>
  );
};

export default MainContent;
