import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPendingAttachments,
  takePendingAttachments,
  clearPendingAttachments,
} from './pendingAttachments';

const makeFile = (name = 'a.png', type = 'image/png') =>
  new File([new Uint8Array([0])], name, { type });

describe('pendingAttachments cache', () => {
  beforeEach(() => clearPendingAttachments());

  it('returns an empty array when nothing has been set', () => {
    expect(takePendingAttachments()).toEqual([]);
  });

  it('stores and returns set files', () => {
    const files = [makeFile('one.png'), makeFile('two.jpg', 'image/jpeg')];
    setPendingAttachments(files);
    expect(takePendingAttachments()).toEqual(files);
  });

  it('clears the cache after take so a second take returns empty', () => {
    setPendingAttachments([makeFile()]);
    takePendingAttachments();
    expect(takePendingAttachments()).toEqual([]);
  });

  it('overwrites previously stashed files on a subsequent set', () => {
    setPendingAttachments([makeFile('old.png')]);
    const next = [makeFile('new.png')];
    setPendingAttachments(next);
    expect(takePendingAttachments()).toEqual(next);
  });

  it('ignores non-File entries defensively', () => {
    setPendingAttachments([makeFile('valid.png'), 'not-a-file', null, undefined, 42]);
    const result = takePendingAttachments();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('valid.png');
  });

  it('treats a non-array input as empty', () => {
    setPendingAttachments(null);
    expect(takePendingAttachments()).toEqual([]);
    setPendingAttachments('files');
    expect(takePendingAttachments()).toEqual([]);
  });

  it('clearPendingAttachments empties the cache', () => {
    setPendingAttachments([makeFile()]);
    clearPendingAttachments();
    expect(takePendingAttachments()).toEqual([]);
  });
});
