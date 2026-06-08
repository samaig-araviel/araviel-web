import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createNewChat,
  selectConversations,
  selectConversationsTotal,
  selectCurrentChatId,
  setConversations,
} from '../store/slices/chatSlice';
import { deleteConversation as apiDeleteConversation } from '../services/api';
import { useToast } from '../components/Toast/Toast';

/**
 * Optimistically delete one or many conversations. On backend failure the
 * Redux list is reverted and the user is toasted; the URL reset stays —
 * sending them back into a "deleted" view is worse than re-opening from
 * the restored list.
 *
 * @returns {(chatIdOrIds: string | string[]) => Promise<boolean>}
 */
export default function useDeleteConversation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showError } = useToast();
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const currentChatId = useSelector(selectCurrentChatId);

  return useCallback(
    async (chatIdOrIds) => {
      const ids = (Array.isArray(chatIdOrIds) ? chatIdOrIds : [chatIdOrIds]).filter(Boolean);
      if (ids.length === 0) return true;

      const idSet = new Set(ids);
      const deletedActive = currentChatId != null && idSet.has(currentChatId);
      const prevConversations = conversations;
      const prevTotal = conversationsTotal;

      dispatch(
        setConversations({
          conversations: conversations.filter((c) => !idSet.has(c.id)),
          total: Math.max(0, conversationsTotal - ids.length),
        })
      );
      if (deletedActive) {
        dispatch(createNewChat());
        navigate('/');
      }

      try {
        await Promise.all(ids.map((id) => apiDeleteConversation(id)));
        return true;
      } catch {
        dispatch(setConversations({ conversations: prevConversations, total: prevTotal }));
        showError(
          ids.length > 1
            ? "Couldn't delete some conversations. Try again."
            : "Couldn't delete this conversation. Try again."
        );
        return false;
      }
    },
    [conversations, conversationsTotal, currentChatId, dispatch, navigate, showError]
  );
}
