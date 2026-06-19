import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraft } from '../use-draft';

// Mock localStorage
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.data[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.data[key]; }),
  clear: vi.fn(() => { mockLocalStorage.data = {}; }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('useDraft hook', () => {
  const draftKey = 'test-draft';

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.data = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveDraft', () => {
    it('should save draft to localStorage', () => {
      const { result } = renderHook(() => useDraft(draftKey));

      act(() => {
        result.current.saveDraft({ title: 'Test Title', content: '<p>Test Content</p>' });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        draftKey,
        JSON.stringify({ title: 'Test Title', content: '<p>Test Content</p>' })
      );
    });

    it('should update existing draft', () => {
      const { result } = renderHook(() => useDraft(draftKey));

      act(() => {
        result.current.saveDraft({ title: 'First Title', content: '<p>First</p>' });
      });

      act(() => {
        result.current.saveDraft({ title: 'Second Title', content: '<p>Second</p>' });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.data[draftKey]).toBe(
        JSON.stringify({ title: 'Second Title', content: '<p>Second</p>' })
      );
    });
  });

  describe('loadDraft', () => {
    it('should return null when no draft exists', () => {
      const { result } = renderHook(() => useDraft(draftKey));

      const draft = result.current.loadDraft();
      expect(draft).toBeNull();
    });

    it('should return saved draft from localStorage', () => {
      const savedDraft = { title: 'Saved Title', content: '<p>Saved Content</p>' };
      mockLocalStorage.data[draftKey] = JSON.stringify(savedDraft);

      const { result } = renderHook(() => useDraft(draftKey));

      const draft = result.current.loadDraft();
      expect(draft).toEqual(savedDraft);
    });

    it('should return null for corrupted draft data', () => {
      mockLocalStorage.data[draftKey] = 'invalid-json';

      const { result } = renderHook(() => useDraft(draftKey));

      const draft = result.current.loadDraft();
      expect(draft).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('should remove draft from localStorage', () => {
      const savedDraft = { title: 'Saved Title', content: '<p>Saved Content</p>' };
      mockLocalStorage.data[draftKey] = JSON.stringify(savedDraft);

      const { result } = renderHook(() => useDraft(draftKey));

      act(() => {
        result.current.clearDraft();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(draftKey);
    });
  });

  describe('hasDraft', () => {
    it('should return false when no draft exists', () => {
      const { result } = renderHook(() => useDraft(draftKey));

      expect(result.current.hasDraft()).toBe(false);
    });

    it('should return true when draft exists', () => {
      const savedDraft = { title: 'Saved Title', content: '<p>Saved Content</p>' };
      mockLocalStorage.data[draftKey] = JSON.stringify(savedDraft);

      const { result } = renderHook(() => useDraft(draftKey));

      expect(result.current.hasDraft()).toBe(true);
    });
  });
});
