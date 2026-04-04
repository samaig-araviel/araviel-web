import { describe, it, expect } from 'vitest';
import { promptsData, quickPromptKeys } from './quickPromptsData';

describe('quickPromptsData', () => {
  it('exports exactly 6 prompt categories', () => {
    expect(Object.keys(promptsData)).toHaveLength(6);
  });

  it('quickPromptKeys matches the keys in promptsData', () => {
    expect(quickPromptKeys).toEqual(['code', 'write', 'research', 'analyze', 'create', 'learn']);
    for (const key of quickPromptKeys) {
      expect(promptsData[key]).toBeDefined();
    }
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
    expect(promptsData.analyze.title).toBe('Analyse');
    expect(promptsData.create.title).toBe('Create');
    expect(promptsData.learn.title).toBe('Learn');
  });
});
