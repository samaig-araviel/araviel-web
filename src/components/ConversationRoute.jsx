import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentChatId } from '../store/slices/chatSlice';
import useLoadConversation from '../hooks/useLoadConversation';
import MainContent from './MainContent';

/**
 * Wrapper that loads a conversation by URL param and renders MainContent.
 * Used for /conversations/:id and /chat/:id routes.
 */
export default function ConversationRoute() {
  const { id } = useParams();
  const currentChatId = useSelector(selectCurrentChatId);
  const loadConversation = useLoadConversation();

  useEffect(() => {
    if (id && id !== currentChatId) {
      loadConversation(id);
    }
  }, [id, currentChatId, loadConversation]);

  return <MainContent />;
}
