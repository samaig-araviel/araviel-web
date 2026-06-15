import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import useFileDrop from './useFileDrop';

const makeFile = (name = 'a.png', type = 'image/png') =>
  new File([new Uint8Array([0])], name, { type });

const makeEvent = (type, files = []) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.dataTransfer = {
    types: files.length > 0 ? ['Files'] : [],
    files,
    dropEffect: 'none',
  };
  return event;
};

describe('useFileDrop', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const renderTargeted = (onFiles, enabled = true) =>
    renderHook(() => {
      const ref = useRef(container);
      return useFileDrop(ref, { onFiles, enabled });
    });

  it('returns isDragging false initially', () => {
    const { result } = renderTargeted(() => {});
    expect(result.current.isDragging).toBe(false);
  });

  it('flips isDragging on file dragenter and back on dragleave', () => {
    const { result } = renderTargeted(() => {});
    act(() => {
      container.dispatchEvent(makeEvent('dragenter', [makeFile()]));
    });
    expect(result.current.isDragging).toBe(true);
    act(() => {
      container.dispatchEvent(makeEvent('dragleave', [makeFile()]));
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('ignores non-file drag events', () => {
    const { result } = renderTargeted(() => {});
    act(() => {
      container.dispatchEvent(makeEvent('dragenter', []));
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('stays dragging across nested dragenter/dragleave pairs', () => {
    const { result } = renderTargeted(() => {});
    act(() => {
      container.dispatchEvent(makeEvent('dragenter', [makeFile()]));
      container.dispatchEvent(makeEvent('dragenter', [makeFile()]));
      container.dispatchEvent(makeEvent('dragleave', [makeFile()]));
    });
    expect(result.current.isDragging).toBe(true);
    act(() => {
      container.dispatchEvent(makeEvent('dragleave', [makeFile()]));
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('calls onFiles with dropped files and resets isDragging', () => {
    const onFiles = vi.fn();
    const { result } = renderTargeted(onFiles);
    const file = makeFile('dropped.png');
    act(() => {
      container.dispatchEvent(makeEvent('dragenter', [file]));
      container.dispatchEvent(makeEvent('drop', [file]));
    });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0]).toEqual([file]);
    expect(result.current.isDragging).toBe(false);
  });

  it('does not call onFiles when drop carries no files', () => {
    const onFiles = vi.fn();
    renderTargeted(onFiles);
    act(() => {
      container.dispatchEvent(makeEvent('drop', []));
    });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onFiles = vi.fn();
    const { result } = renderTargeted(onFiles, false);
    act(() => {
      container.dispatchEvent(makeEvent('dragenter', [makeFile()]));
      container.dispatchEvent(makeEvent('drop', [makeFile()]));
    });
    expect(result.current.isDragging).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('preventDefault is called on dragover so the browser allows drop', () => {
    renderTargeted(() => {});
    const event = makeEvent('dragover', [makeFile()]);
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
