import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowList } from '../follow-list';
import type { User } from '@jianshu/shared';

// Mock API
const mockGetFollowers = vi.fn();
const mockGetFollowing = vi.fn();
vi.mock('@/lib/api', () => ({
  userApi: {
    getFollowers: (...args: unknown[]) => mockGetFollowers(...args),
    getFollowing: (...args: unknown[]) => mockGetFollowing(...args),
  },
}));

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock useFollow
vi.mock('@/hooks/use-follow', () => ({
  useFollow: () => ({
    isFollowing: false,
    isPending: false,
    toggleFollow: vi.fn(),
  }),
}));

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'jane@example.com',
    username: 'jane',
    name: 'Jane Doe',
    bio: 'Developer',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    followerCount: 100,
    followingCount: 50,
    articleCount: 25,
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    username: 'bob',
    name: 'Bob Smith',
    bio: 'Designer',
    avatar: null,
    createdAt: new Date('2024-01-01'),
    followerCount: 200,
    followingCount: 30,
    articleCount: 10,
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('FollowList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Followers type', () => {
    it('should render followers list', async () => {
      mockGetFollowers.mockResolvedValue({
        success: true,
        data: { items: mockUsers, total: 2, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="followers" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('should call getFollowers API', async () => {
      mockGetFollowers.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="followers" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockGetFollowers).toHaveBeenCalledWith('john', { page: 1, limit: 50 });
      });
    });
  });

  describe('Following type', () => {
    it('should render following list', async () => {
      mockGetFollowing.mockResolvedValue({
        success: true,
        data: { items: mockUsers, total: 2, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="following" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      });
    });

    it('should call getFollowing API', async () => {
      mockGetFollowing.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="following" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockGetFollowing).toHaveBeenCalledWith('john', { page: 1, limit: 50 });
      });
    });
  });

  describe('Empty state', () => {
    it('should show "暂无粉丝" when no followers', async () => {
      mockGetFollowers.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="followers" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('暂无粉丝')).toBeInTheDocument();
      });
    });

    it('should show "暂无关注" when not following anyone', async () => {
      mockGetFollowing.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="following" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('暂无关注')).toBeInTheDocument();
      });
    });
  });

  describe('User links', () => {
    it('should render username with @ prefix', async () => {
      mockGetFollowers.mockResolvedValue({
        success: true,
        data: { items: [mockUsers[0]], total: 1, page: 1, limit: 50 },
      });

      render(<FollowList username="john" type="followers" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('@jane')).toBeInTheDocument();
      });
    });
  });
});
