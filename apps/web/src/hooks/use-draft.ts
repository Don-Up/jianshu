'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface DraftData {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
}

interface UseDraftResult {
  saveDraft: (data: DraftData) => void;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

export function useDraft(key: string): UseDraftResult {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveDraft = useCallback((data: DraftData) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [key]);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored) as DraftData;
      return data;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  const hasDraft = useCallback((): boolean => {
    return localStorage.getItem(key) !== null;
  }, [key]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
  };
}

// Auto-save hook for use with article editor
export function useAutoSave(
  key: string,
  data: DraftData,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const { saveDraft, clearDraft, loadDraft } = useDraft(key);
  const lastSavedRef = useRef<string>('');

  // Save on unmount
  useEffect(() => {
    return () => {
      if (enabled && lastSavedRef.current !== JSON.stringify(data)) {
        saveDraft(data);
      }
    };
  }, [enabled, data, saveDraft]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      const currentData = JSON.stringify(data);
      if (currentData !== lastSavedRef.current) {
        saveDraft(data);
        lastSavedRef.current = currentData;
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, data, intervalMs, saveDraft]);

  // Restore draft on mount
  const restoreDraft = useCallback((): DraftData | null => {
    const draft = loadDraft();
    if (draft) {
      lastSavedRef.current = JSON.stringify(draft);
    }
    return draft;
  }, [loadDraft]);

  return {
    restoreDraft,
    clearDraft,
    hasDraft: useDraft(key).hasDraft,
  };
}
