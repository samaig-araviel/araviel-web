import { useEffect, useRef, useState } from 'react';

const eventHasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

export default function useFileDrop(targetRef, { onFiles, enabled = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const counterRef = useRef(0);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) {
      counterRef.current = 0;
      setIsDragging(false);
      return undefined;
    }

    const handleDragEnter = (event) => {
      if (!eventHasFiles(event)) return;
      event.preventDefault();
      counterRef.current += 1;
      if (counterRef.current === 1) setIsDragging(true);
    };

    const handleDragLeave = (event) => {
      if (!eventHasFiles(event)) return;
      event.preventDefault();
      counterRef.current = Math.max(0, counterRef.current - 1);
      if (counterRef.current === 0) setIsDragging(false);
    };

    const handleDragOver = (event) => {
      if (!eventHasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (event) => {
      if (!eventHasFiles(event)) return;
      event.preventDefault();
      counterRef.current = 0;
      setIsDragging(false);
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length > 0) onFilesRef.current?.(files);
    };

    el.addEventListener('dragenter', handleDragEnter);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);

    return () => {
      el.removeEventListener('dragenter', handleDragEnter);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('drop', handleDrop);
    };
  }, [targetRef, enabled]);

  useEffect(() => {
    const prevent = (event) => {
      if (eventHasFiles(event)) event.preventDefault();
    };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  return { isDragging };
}
