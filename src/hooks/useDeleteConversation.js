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
 * Single source of truth for deleting one or more conversations.
 *
 * Every delete entry point in the app — sidebar item menu, in-chat header
 * menu, `/conversations` single + bulk delete, project view — calls this
 * hook so the post-confirm flow is identical:
 *
 *   1. Optimistically remove the rows from the sidebar list (Redux).
 *   2. If one of the rows is the currently-open conversation, clear the
 *      chat surface and pop the URL back to `/`. Otherwise leave the
 *      surface alone.
 *   3. Persist the delete to the backend.
 *   4. On failure, revert the Redux list and toast the user. The URL
 *      reset stays — pushing the user back into a "deleted" view is
 *      worse than asking them to re-open from the now-restored list.
 *
 * Confirmation UX stays at the call site so each surface can keep its
 * own modal styling — this hook only owns the post-confirm flow.
 *
 * @returns {(chatIdOrIds: string | string[]) => Promise<boolean>} a
 *   stable callback that returns `true` when every backend delete
 *   succeeded and `false` if any failed (and was reverted).
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
      const ids = Array.isArray(chatIdOrIds) ? chatIdOrIds : [chatIdOrIds];
      const validIds = ids.filter(Boolean);
      if (validIds.length === 0) return true;

      const idSet = new Set(validIds);
      const deletedActive = currentChatId != null && idSet.has(currentChatId);
      const prevConversations = conversations;
      const prevTotal = conversationsTotal;

      dispatch(
        setConversations({
          conversations: conversations.filter((c) => !idSet.has(c.id)),
          total: Math.max(0, conversationsTotal - validIds.length),
        })
      );
      if (deletedActive) {
        dispatch(createNewChat());
        navigate('/');
      }

      try {
        await Promise.all(validIds.map((id) => apiDeleteConversation(id)));
        return true;
      } catch {
        dispatch(setConversations({ conversations: prevConversations, total: prevTotal }));
        showError(
          validIds.length > 1
            ? "Couldn't delete some conversations. Try again."
            : "Couldn't delete this conversation. Try again."
        );
        return false;
      }
    },
    [conversations, conversationsTotal, currentChatId, dispatch, navigate, showError]
  );
}
