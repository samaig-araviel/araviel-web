import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentChatId } from '../store/slices/chatSlice';
import useLoadConversation from '../hooks/useLoadConversation';
import MainContent from './MainContent';
import NotFound from './ErrorBoundary/NotFound';

export default function ConversationRoute() {
  const { id } = useParams();
  const currentChatId = useSelector(selectCurrentChatId);
  const { loadConversation, notFound } = useLoadConversation();

  useEffect(() => {
    if (id && id !== currentChatId) {
      loadConversation(id);
    }
  }, [id, currentChatId, loadConversation]);

  if (notFound) return <NotFound />;
  return <MainContent />;
}
