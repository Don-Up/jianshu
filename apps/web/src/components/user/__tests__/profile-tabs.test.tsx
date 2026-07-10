import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileTabs } from '../profile-tabs';

describe('ProfileTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render articles tab', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );
      expect(screen.getByText('文章')).toBeInTheDocument();
    });

    it('should render followers tab', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );
      expect(screen.getByText('粉丝')).toBeInTheDocument();
    });

    it('should render following tab', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );
      expect(screen.getByText('关注')).toBeInTheDocument();
    });

    it('should render collections tab when isOwnProfile is true', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={true}
        />
      );
      expect(screen.getByText('收藏集')).toBeInTheDocument();
    });

    it('should not render collections tab when isOwnProfile is false', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );
      expect(screen.queryByText('收藏集')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onTabChange when tab is clicked', () => {
      const onTabChange = vi.fn();
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={onTabChange}
          isOwnProfile={false}
        />
      );

      fireEvent.click(screen.getByText('粉丝'));
      expect(onTabChange).toHaveBeenCalledWith('followers');
    });

    it('should call onTabChange with correct tab value', () => {
      const onTabChange = vi.fn();
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={onTabChange}
          isOwnProfile={true}
        />
      );

      fireEvent.click(screen.getByText('收藏集'));
      expect(onTabChange).toHaveBeenCalledWith('collections');

      fireEvent.click(screen.getByText('关注'));
      expect(onTabChange).toHaveBeenCalledWith('following');
    });
  });

  describe('active state', () => {
    it('should show active indicator on current tab', () => {
      render(
        <ProfileTabs
          activeTab="followers"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );

      const followersTab = screen.getByText('粉丝');
      expect(followersTab).toHaveClass('text-primary');
    });

    it('should not show active indicator on inactive tabs', () => {
      render(
        <ProfileTabs
          activeTab="articles"
          onTabChange={vi.fn()}
          isOwnProfile={false}
        />
      );

      const followersTab = screen.getByText('粉丝');
      expect(followersTab).toHaveClass('text-muted-foreground');
    });
  });
});
