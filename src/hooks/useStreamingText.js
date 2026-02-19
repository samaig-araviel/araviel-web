import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for streaming text word-by-word with natural timing.
 *
 * @param {string} fullText - The complete text to stream
 * @param {boolean} shouldStream - Whether streaming should begin
 * @param {object} options - Configuration options
 * @param {number} options.baseDelay - Base delay between words in ms (default: 28)
 * @param {number} options.variance - Random variance added to delay (default: 16)
 * @param {number} options.punctuationPause - Extra delay after punctuation (default: 80)
 * @param {number} options.paragraphPause - Extra delay after paragraph breaks (default: 140)
 * @param {Function} options.onComplete - Callback when streaming finishes
 *
 * @returns {{ streamedText: string, isStreaming: boolean, progress: number }}
 */
export default function useStreamingText(fullText, shouldStream, options = {}) {
  const {
    baseDelay = 28,
    variance = 16,
    punctuationPause = 80,
    paragraphPause = 140,
    onComplete,
  } = options;

  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);
  const wordsRef = useRef([]);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Split text into streamable tokens (words + whitespace/newlines)
  const tokenize = useCallback((text) => {
    if (!text) return [];
    const tokens = [];
    let current = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '\n') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        // Collect consecutive newlines as one token
        let newlines = '\n';
        while (i + 1 < text.length && text[i + 1] === '\n') {
          newlines += '\n';
          i++;
        }
        tokens.push(newlines);
      } else if (char === ' ') {
        if (current) {
          tokens.push(current + ' ');
          current = '';
        } else {
          tokens.push(' ');
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }, []);

  // Calculate delay for a given token
  const getDelay = useCallback(
    (token) => {
      let delay = baseDelay + Math.random() * variance;

      // Pause longer after punctuation
      if (/[.!?;:]$/.test(token.trim())) {
        delay += punctuationPause;
      } else if (/[,]$/.test(token.trim())) {
        delay += punctuationPause * 0.4;
      }

      // Pause longer at paragraph breaks
      if (token.includes('\n\n')) {
        delay += paragraphPause;
      } else if (token.includes('\n')) {
        delay += paragraphPause * 0.5;
      }

      // Code blocks stream a bit faster
      if (token.startsWith('```') || /^\s{2,}/.test(token)) {
        delay = Math.max(delay * 0.4, 8);
      }

      return delay;
    },
    [baseDelay, variance, punctuationPause, paragraphPause]
  );

  // Start/reset streaming when text or trigger changes
  useEffect(() => {
    if (!shouldStream || !fullText) {
      return;
    }

    // Reset
    setStreamedText('');
    setIsStreaming(true);
    indexRef.current = 0;
    wordsRef.current = tokenize(fullText);

    const streamNext = () => {
      if (indexRef.current >= wordsRef.current.length) {
        setStreamedText(fullText);
        setIsStreaming(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      const token = wordsRef.current[indexRef.current];
      indexRef.current++;

      setStreamedText((prev) => prev + token);

      const delay = getDelay(token);
      timeoutRef.current = setTimeout(streamNext, delay);
    };

    // Small initial delay before first word appears
    timeoutRef.current = setTimeout(streamNext, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fullText, shouldStream, tokenize, getDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Imperatively stop streaming, preserving current progress
  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const progress = wordsRef.current.length > 0 ? indexRef.current / wordsRef.current.length : 0;

  return { streamedText, isStreaming, progress, stop };
}
