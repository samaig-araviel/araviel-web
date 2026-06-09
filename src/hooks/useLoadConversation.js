import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentChat, setMessages } from '../store/slices/chatSlice';
import { fetchConversationMessages } from '../services/api';
import { getGeneratedImages } from '../services/imageGeneration';

function mapMessages(rawMessages, storedImages) {
  return (rawMessages || []).map((msg) => {
    const base = {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.createdAt).getTime(),
    };

    if (msg.role === 'assistant') {
      let generatedImages = msg.generatedImages || [];

      if (generatedImages.length === 0) {
        let matched = storedImages.filter((img) => img.messageId && img.messageId === msg.id);
        if (matched.length === 0) {
          const msgTime = new Date(msg.createdAt).getTime();
          matched = storedImages.filter((img) => Math.abs(img.createdAt - msgTime) < 30000);
        }
        if (matched.length > 0) {
          generatedImages = matched.map((img) => ({
            url: img.url,
            prompt: img.prompt,
            model: img.model,
            provider: img.provider,
            id: img.id,
          }));
        }
      }

      if (generatedImages.length === 0 && msg.content) {
        const imgRe = /!\[Generated image[^\]]*\]\(([^)]+)\)/g;
        let m;
        while ((m = imgRe.exec(msg.content)) !== null) {
          generatedImages.push({
            url: m[1],
            prompt: msg.content.match(/!\[Generated image:?\s*([^\]]*)\]/)?.[1] || '',
            model: msg.model?.name || 'unknown',
            provider: msg.model?.provider || 'unknown',
            id: `content-${msg.id}-${generatedImages.length}`,
          });
        }
      }

      Object.assign(base, {
        modelId: msg.model?.id,
        modelName: msg.model?.name,
        provider: msg.model?.provider,
        score: msg.model?.score,
        reasoning: msg.model?.reasoning,
        alternateModels: (msg.alternateModels || []).map((m) => ({
          modelId: m.id,
          modelName: m.name,
          provider: m.provider,
          score: m.score,
          reasoning: m.reasoning,
        })),
        thinkingContent: msg.thinkingContent,
        citations: msg.citations,
        usage: msg.usage,
        costUsd: msg.costUsd,
        latencyMs: msg.latencyMs,
        adeLatencyMs: msg.adeLatencyMs,
        followUps: msg.followUps || [],
        questions: msg.questions || [],
        feedback: msg.feedback || null,
        ...(generatedImages.length > 0 && { generatedImages }),
      });
    }

    if (msg.role === 'user' && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      base.attachments = msg.attachments;
    }

    return base;
  });
}

export default function useLoadConversation() {
  const dispatch = useDispatch();
  const [notFound, setNotFound] = useState(false);

  const loadConversation = useCallback(
    async (chatId) => {
      setNotFound(false);
      dispatch(setCurrentChat(chatId));
      dispatch(setMessages([]));
      try {
        const data = await fetchConversationMessages(chatId);
        const storedImages = getGeneratedImages();
        dispatch(setMessages(mapMessages(data.messages, storedImages)));
      } catch (err) {
        if (err?.status === 404) setNotFound(true);
      }
    },
    [dispatch]
  );

  return { loadConversation, notFound };
}
