import {
  setInputValue,
  applyImageQuickPromptOverride,
  revertQuickPromptImageOverride,
} from '../store/slices/chatSlice';
import { recordEvent } from '../store/slices/analyticsSlice';
import { getDefaultImageQualityForTier } from '../config/credits';
import { promptsData, IMAGE_QUICK_PROMPT_KEY } from './quickPromptsData';

/**
 * Resolve the prompt item for a given pill + index.
 * Returns null when the pill or index is unknown.
 *
 * @param {string} pillKey
 * @param {number} itemIndex
 * @returns {{ text: string, icon: Function } | null}
 */
export const getQuickPromptItem = (pillKey, itemIndex) =>
  promptsData[pillKey]?.items?.[itemIndex] ?? null;

/**
 * Dispatch the full side-effect chain triggered by selecting a quick-prompt
 * dropdown item. Extracted so the flow is unit-testable without having to
 * render the MainContent component tree.
 *
 * Side effects, in order:
 *   1. Prefill the chat input with the prompt text (+ trailing space).
 *   2. For the Image pill, fire the one-shot modality + quality override
 *      using the user's tier-appropriate default quality.
 *   3. Emit a `quick_prompt_selected` telemetry event.
 *
 * @param {object} params
 * @param {Function} params.dispatch - Redux dispatch.
 * @param {string} params.pillKey - e.g. 'code', 'image'.
 * @param {number} params.itemIndex - 0-based index within the pill.
 * @param {string | null | undefined} params.currentTier - 'free' | 'lite' | 'pro'.
 * @returns {{ text: string, isImagePill: boolean } | null}
 *   The prompt metadata applied, or null if the selection was invalid.
 */
export function handleQuickPromptSelection({ dispatch, pillKey, itemIndex, currentTier }) {
  const item = getQuickPromptItem(pillKey, itemIndex);
  if (!item) return null;

  const isImagePill = pillKey === IMAGE_QUICK_PROMPT_KEY;

  dispatch(setInputValue(item.text + ' '));

  if (isImagePill) {
    dispatch(applyImageQuickPromptOverride(getDefaultImageQualityForTier(currentTier)));
  } else {
    // Picking a non-image prompt after an image one cancels the pending
    // one-shot so the modality bounces back to whatever it was before the
    // Image pill was clicked. A no-op when no override is active.
    dispatch(revertQuickPromptImageOverride());
  }

  dispatch(
    recordEvent({
      name: 'quick_prompt_selected',
      properties: {
        pill_category: pillKey,
        prompt_index: itemIndex,
        user_tier: currentTier || 'guest',
        prompt_type_set: isImagePill ? 'image' : 'text',
      },
    })
  );

  return { text: item.text, isImagePill };
}
