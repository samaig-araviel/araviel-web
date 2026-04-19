import { describe, it, expect } from 'vitest';
import { promptsData, quickPromptKeys, IMAGE_QUICK_PROMPT_KEY } from './quickPromptsData';

describe('quickPromptsData', () => {
  it('exports exactly 5 prompt categories', () => {
    expect(Object.keys(promptsData)).toHaveLength(5);
  });

  it('quickPromptKeys matches the keys in promptsData in the expected order', () => {
    expect(quickPromptKeys).toEqual(['code', 'write', 'research', 'image', 'analyze']);
    for (const key of quickPromptKeys) {
      expect(promptsData[key]).toBeDefined();
    }
  });

  it('no longer exposes the Learn or Create pills', () => {
    expect(promptsData.learn).toBeUndefined();
    expect(promptsData.create).toBeUndefined();
    expect(quickPromptKeys).not.toContain('learn');
    expect(quickPromptKeys).not.toContain('create');
  });

  it('exposes the image pill key constant matching the data key', () => {
    expect(IMAGE_QUICK_PROMPT_KEY).toBe('image');
    expect(promptsData[IMAGE_QUICK_PROMPT_KEY]).toBeDefined();
  });

  it('each category has a title, icon, and items array', () => {
    for (const key of quickPromptKeys) {
      const category = promptsData[key];
      expect(category.title).toBeDefined();
      expect(typeof category.title).toBe('string');
      expect(category.icon).toBeDefined();
      expect(Array.isArray(category.items)).toBe(true);
      expect(category.items.length).toBeGreaterThan(0);
    }
  });

  it('each item has text and icon properties', () => {
    for (const key of quickPromptKeys) {
      for (const item of promptsData[key].items) {
        expect(typeof item.text).toBe('string');
        expect(item.text.length).toBeGreaterThan(0);
        expect(item.icon).toBeDefined();
      }
    }
  });

  it('each category has exactly 4 items', () => {
    for (const key of quickPromptKeys) {
      expect(promptsData[key].items).toHaveLength(4);
    }
  });

  it('has the expected category titles', () => {
    expect(promptsData.code.title).toBe('Code');
    expect(promptsData.write.title).toBe('Write');
    expect(promptsData.research.title).toBe('Research');
    expect(promptsData.image.title).toBe('Image');
    expect(promptsData.analyze.title).toBe('Analyse');
  });

  it('ships the requested prompt texts for each pill', () => {
    expect(promptsData.code.items.map((i) => i.text)).toEqual([
      'Debug a React TypeError',
      'Refactor this function for performance',
      'Explain this codebase architecture',
      'Write tests for this module',
    ]);
    expect(promptsData.write.items.map((i) => i.text)).toEqual([
      'Draft a follow-up email to a recruiter',
      'Write a LinkedIn post about a product launch',
      'Outline a blog article on a given topic',
      'Rewrite this paragraph more concisely',
    ]);
    expect(promptsData.research.items.map((i) => i.text)).toEqual([
      'What happened in AI this week',
      'Compare the top 3 project management tools in 2026',
      'Find recent studies on intermittent fasting',
      "Summarise today's market movements",
    ]);
    expect(promptsData.image.items.map((i) => i.text)).toEqual([
      'A minimalist logo for a fintech startup',
      'Cinematic photo of a London street at dusk',
      'Infographic showing the AI provider landscape',
      'Watercolour illustration of a coastal village',
    ]);
    expect(promptsData.analyze.items.map((i) => i.text)).toEqual([
      'Analyse this CSV and find trends',
      'Summarise this PDF in 5 bullets',
      'Extract action items from these meeting notes',
      'Compare these two contracts',
    ]);
  });
});
