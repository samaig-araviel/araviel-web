import { useEffect, useRef } from 'react';

export default function usePasteImages({ onFiles, enabled = true }) {
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind !== 'file') continue;
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
      if (files.length === 0) return;
      onFilesRef.current?.(files);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enabled]);
}
