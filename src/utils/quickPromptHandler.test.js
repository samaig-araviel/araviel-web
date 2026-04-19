import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  selectInputValue,
  selectSelectedModality,
  selectImageQuality,
  selectQuickPromptImageOverride,
  setImageQuality,
  setSelectedModality,
  revertQuickPromptImageOverride,
} from '../store/slices/chatSlice';
import analyticsReducer, { selectRecentEvents } from '../store/slices/analyticsSlice';
import { handleQuickPromptSelection, getQuickPromptItem } from './quickPromptHandler';
import { promptsData, quickPromptKeys, IMAGE_QUICK_PROMPT_KEY } from './quickPromptsData';

vi.mock('../data/models', () => ({
  isModelAccessible: vi.fn(() => true),
}));

const buildStore = () =>
  configureStore({
    reducer: {
      chat: chatReducer,
      analytics: analyticsReducer,
    },
  });

describe('handleQuickPromptSelection — quick prompt flow', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = buildStore();
  });

  describe('non-image pills', () => {
    for (const pillKey of quickPromptKeys.filter((k) => k !== IMAGE_QUICK_PROMPT_KEY)) {
      it(`${pillKey}: sets input text and keeps modality as text`, () => {
        const pill = promptsData[pillKey];
        for (let index = 0; index < pill.items.length; index++) {
          const scopedStore = buildStore();
          const item = pill.items[index];
          const result = handleQuickPromptSelection({
            dispatch: scopedStore.dispatch,
            pillKey,
            itemIndex: index,
            currentTier: 'free',
          });

          expect(result).toEqual({ text: item.text, isImagePill: false });
          expect(selectInputValue(scopedStore.getState())).toBe(item.text + ' ');
          expect(selectSelectedModality(scopedStore.getState())).toBe('text');
          expect(selectImageQuality(scopedStore.getState())).toBe('standard');
          expect(selectQuickPromptImageOverride(scopedStore.getState())).toBeNull();
        }
      });
    }
  });

  describe('image pill', () => {
    const tierExpectations = [
      { tier: 'free', expected: 'standard' },
      { tier: 'lite', expected: 'hd' },
      { tier: 'pro', expected: 'ultra' },
    ];

    for (const { tier, expected } of tierExpectations) {
      it(`applies the image one-shot for ${tier} tier (quality: ${expected})`, () => {
        const result = handleQuickPromptSelection({
          dispatch: store.dispatch,
          pillKey: IMAGE_QUICK_PROMPT_KEY,
          itemIndex: 0,
          currentTier: tier,
        });

        const expectedText = promptsData[IMAGE_QUICK_PROMPT_KEY].items[0].text;
        expect(result).toEqual({ text: expectedText, isImagePill: true });

        const state = store.getState();
        // Both input text AND prompt type state must update (not one or the other).
        expect(selectInputValue(state)).toBe(expectedText + ' ');
        expect(selectSelectedModality(state)).toBe('image');
        expect(selectImageQuality(state)).toBe(expected);
        expect(selectQuickPromptImageOverride(state)).toEqual({
          previousModality: 'text',
          previousQuality: 'standard',
        });
      });
    }

    it('falls back to the lowest-quality default for an unknown tier', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: IMAGE_QUICK_PROMPT_KEY,
        itemIndex: 0,
        currentTier: null,
      });
      expect(selectImageQuality(store.getState())).toBe('standard');
      expect(selectSelectedModality(store.getState())).toBe('image');
    });

    it('revert on submit restores the previous modality and quality', () => {
      // User was on text + standard. Pick an image prompt → override kicks in.
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: IMAGE_QUICK_PROMPT_KEY,
        itemIndex: 1,
        currentTier: 'pro',
      });
      expect(selectSelectedModality(store.getState())).toBe('image');
      expect(selectImageQuality(store.getState())).toBe('ultra');

      // Simulate the submit-time revert wired into handleSubmit.
      store.dispatch(revertQuickPromptImageOverride());

      const state = store.getState();
      expect(selectSelectedModality(state)).toBe('text');
      expect(selectImageQuality(state)).toBe('standard');
      expect(selectQuickPromptImageOverride(state)).toBeNull();
    });

    it('manual modality override beats the one-shot: revert becomes a no-op', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: IMAGE_QUICK_PROMPT_KEY,
        itemIndex: 0,
        currentTier: 'lite',
      });
      // User manually flips back to text via the ModalityBar.
      store.dispatch(setSelectedModality('text'));
      expect(selectSelectedModality(store.getState())).toBe('text');
      expect(selectQuickPromptImageOverride(store.getState())).toBeNull();

      // Later submit would revert — but override is gone, so the user's choice stands.
      store.dispatch(revertQuickPromptImageOverride());
      expect(selectSelectedModality(store.getState())).toBe('text');
      expect(selectImageQuality(store.getState())).toBe('hd');
    });

    it('manual quality change beats the one-shot modality revert', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: IMAGE_QUICK_PROMPT_KEY,
        itemIndex: 0,
        currentTier: 'free',
      });
      // User bumps quality from standard (tier default) to ultra themselves.
      store.dispatch(setImageQuality('ultra'));
      expect(selectImageQuality(store.getState())).toBe('ultra');
      expect(selectQuickPromptImageOverride(store.getState())).toBeNull();

      // After submit, quality stays ultra, modality stays image.
      store.dispatch(revertQuickPromptImageOverride());
      expect(selectImageQuality(store.getState())).toBe('ultra');
      expect(selectSelectedModality(store.getState())).toBe('image');
    });
  });

  describe('telemetry', () => {
    it('emits quick_prompt_selected with the expected shape for an image prompt', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: IMAGE_QUICK_PROMPT_KEY,
        itemIndex: 2,
        currentTier: 'pro',
      });
      const events = selectRecentEvents(store.getState());
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        name: 'quick_prompt_selected',
        properties: {
          pill_category: 'image',
          prompt_index: 2,
          user_tier: 'pro',
          prompt_type_set: 'image',
        },
      });
    });

    it('emits quick_prompt_selected with prompt_type_set=text for non-image pills', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: 'code',
        itemIndex: 1,
        currentTier: 'lite',
      });
      const events = selectRecentEvents(store.getState());
      expect(events[0].properties).toEqual({
        pill_category: 'code',
        prompt_index: 1,
        user_tier: 'lite',
        prompt_type_set: 'text',
      });
    });

    it('falls back to user_tier=guest when the tier is missing', () => {
      handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: 'write',
        itemIndex: 0,
        currentTier: null,
      });
      expect(selectRecentEvents(store.getState())[0].properties.user_tier).toBe('guest');
    });
  });

  describe('invalid selection', () => {
    it('returns null and dispatches nothing when the pill key is unknown', () => {
      const result = handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: 'not-a-pill',
        itemIndex: 0,
        currentTier: 'pro',
      });
      expect(result).toBeNull();
      expect(selectInputValue(store.getState())).toBe('');
      expect(selectRecentEvents(store.getState())).toHaveLength(0);
    });

    it('returns null when the item index is out of range', () => {
      const result = handleQuickPromptSelection({
        dispatch: store.dispatch,
        pillKey: 'code',
        itemIndex: 99,
        currentTier: 'pro',
      });
      expect(result).toBeNull();
    });
  });

  describe('getQuickPromptItem', () => {
    it('returns the matching item for valid coordinates', () => {
      const item = getQuickPromptItem('code', 0);
      expect(item?.text).toBe('Debug a React TypeError');
    });

    it('returns null for invalid coordinates', () => {
      expect(getQuickPromptItem('missing', 0)).toBeNull();
      expect(getQuickPromptItem('code', -1)).toBeNull();
    });
  });
});
