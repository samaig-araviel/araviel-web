import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePasteImages from './usePasteImages';

const makeFile = (name = 'pasted.png', type = 'image/png') =>
  new File([new Uint8Array([0])], name, { type });

const firePaste = (items) => {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  event.clipboardData = { items };
  document.dispatchEvent(event);
};

const fileItem = (file) => ({
  kind: 'file',
  type: file.type,
  getAsFile: () => file,
});

const stringItem = (type = 'text/plain') => ({
  kind: 'string',
  type,
  getAsFile: () => null,
});

describe('usePasteImages', () => {
  it('calls onFiles with image files pasted from the clipboard', () => {
    const onFiles = vi.fn();
    renderHook(() => usePasteImages({ onFiles }));
    const file = makeFile();
    firePaste([fileItem(file)]);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0]).toEqual([file]);
  });

  it('filters out non-image file items', () => {
    const onFiles = vi.fn();
    renderHook(() => usePasteImages({ onFiles }));
    const pdf = makeFile('a.pdf', 'application/pdf');
    firePaste([fileItem(pdf)]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('ignores string clipboard items', () => {
    const onFiles = vi.fn();
    renderHook(() => usePasteImages({ onFiles }));
    firePaste([stringItem()]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onFiles = vi.fn();
    renderHook(() => usePasteImages({ onFiles, enabled: false }));
    firePaste([fileItem(makeFile())]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('returns image files alongside text items when both are present', () => {
    const onFiles = vi.fn();
    renderHook(() => usePasteImages({ onFiles }));
    const file = makeFile();
    firePaste([stringItem(), fileItem(file)]);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0]).toEqual([file]);
  });
});
