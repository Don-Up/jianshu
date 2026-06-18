import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettings } from '../use-settings';

vi.mock('@/lib/api', () => ({
  userApi: {
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

describe('useSettings hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should be defined as a function', () => {
      const { result } = renderHook(() => useSettings());
      expect(typeof result.current.updateProfile).toBe('function');
    });

    it('should return isUpdatingProfile boolean', () => {
      const { result } = renderHook(() => useSettings());
      expect(typeof result.current.isUpdatingProfile).toBe('boolean');
    });

    it('should return updateProfileError as null initially', () => {
      const { result } = renderHook(() => useSettings());
      expect(result.current.updateProfileError).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should be defined as a function', () => {
      const { result } = renderHook(() => useSettings());
      expect(typeof result.current.changePassword).toBe('function');
    });

    it('should return isChangingPassword boolean', () => {
      const { result } = renderHook(() => useSettings());
      expect(typeof result.current.isChangingPassword).toBe('boolean');
    });

    it('should return changePasswordError as null initially', () => {
      const { result } = renderHook(() => useSettings());
      expect(result.current.changePasswordError).toBeNull();
    });
  });
});
