import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '@/app/(app)/settings/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock use-auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: null,
      avatar: null,
      createdAt: new Date('2024-01-01'),
    },
    isAuthenticated: true,
    isLoading: false,
    updateUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock use-settings hook
vi.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({
    updateProfile: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
    isUpdatingProfile: false,
    isChangingPassword: false,
    updateProfileError: null,
    changePasswordError: null,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock Input
vi.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    defaultValue,
    disabled,
    type,
    onChange,
    placeholder,
  }: {
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    type?: string;
    onChange?: () => void;
    placeholder?: string;
  }) => (
    <input
      value={value ?? defaultValue}
      disabled={disabled}
      type={type || 'text'}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AvatarImage: () => <div />,
}));

// Mock PageLayout
vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SettingsPage', () => {
  it('should render page title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('设置')).toBeInTheDocument();
  });

  it('should render profile section with user name', () => {
    render(<SettingsPage />);
    expect(screen.getByText('基本信息')).toBeInTheDocument();
  });

  it('should render password change section', () => {
    render(<SettingsPage />);
    // First "修改密码" is the section header
    expect(screen.getByRole('heading', { level: 2, name: '修改密码' })).toBeInTheDocument();
  });

  it('should have save button for profile', () => {
    render(<SettingsPage />);
    expect(screen.getByText('保存修改')).toBeInTheDocument();
  });

  it('should have change password button', () => {
    render(<SettingsPage />);
    // Button labeled "修改密码" is in the password section footer
    const buttons = screen.getAllByRole('button');
    const passwordButton = buttons.find(btn => btn.textContent === '修改密码');
    expect(passwordButton).toBeInTheDocument();
  });

  it('should show change avatar button', () => {
    render(<SettingsPage />);
    expect(screen.getByText('更换头像')).toBeInTheDocument();
  });

  it('should render password fields', () => {
    render(<SettingsPage />);
    expect(screen.getByText('当前密码')).toBeInTheDocument();
    expect(screen.getByText('新密码')).toBeInTheDocument();
    expect(screen.getByText('确认新密码')).toBeInTheDocument();
  });
});