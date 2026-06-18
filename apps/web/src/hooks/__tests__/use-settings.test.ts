import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettings } from '../use-settings';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Test schema for profile update validation
const profileSchema = z.object({
  name: z.string().min(1, '昵称不能为空').trim().refine((val) => val.length > 0, {
    message: '昵称不能为空',
  }),
  bio: z.string().optional(),
  avatar: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

// Test schema for password change validation
const passwordSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的新密码不一致',
  path: ['confirmPassword'],
});

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

describe('Profile form validation', () => {
  it('should validate name is required', async () => {
    const result = profileSchema.safeParse({ name: '', bio: 'test bio' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('昵称不能为空');
    }
  });

  it('should validate name is not just whitespace', async () => {
    const result = profileSchema.safeParse({ name: '   ', bio: 'test bio' });
    expect(result.success).toBe(false);
  });

  it('should accept valid profile data', async () => {
    const result = profileSchema.safeParse({
      name: 'Test User',
      bio: 'Hello world',
      avatar: '',
    });
    expect(result.success).toBe(true);
  });

  it('should validate avatar URL format', async () => {
    const result = profileSchema.safeParse({
      name: 'Test User',
      bio: 'test',
      avatar: 'not-a-url',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('请输入有效的 URL');
    }
  });
});

describe('Password change validation', () => {
  it('should require old password', async () => {
    const result = passwordSchema.safeParse({
      oldPassword: '',
      newPassword: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('请输入当前密码');
    }
  });

  it('should require new password to be at least 6 characters', async () => {
    const result = passwordSchema.safeParse({
      oldPassword: 'oldpass',
      newPassword: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('新密码至少6个字符');
    }
  });

  it('should require confirm password to match new password', async () => {
    const result = passwordSchema.safeParse({
      oldPassword: 'oldpass',
      newPassword: 'password123',
      confirmPassword: 'differentpass',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('两次输入的新密码不一致');
    }
  });

  it('should accept valid password change data', async () => {
    const result = passwordSchema.safeParse({
      oldPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result.success).toBe(true);
  });
});
