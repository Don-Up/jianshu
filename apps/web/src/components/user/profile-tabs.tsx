'use client';

import { cn } from '@/lib/utils';

export type ProfileTab = 'articles' | 'collections' | 'followers' | 'following';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwnProfile: boolean;
  followersCount?: number;
  followingCount?: number;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  isOwnProfile,
  followersCount = 0,
  followingCount = 0,
}: ProfileTabsProps) {
  const tabs: { key: ProfileTab; label: string; show: boolean }[] = [
    { key: 'articles', label: '文章', show: true },
    { key: 'collections', label: '收藏集', show: isOwnProfile },
    { key: 'followers', label: '粉丝', show: true },
    { key: 'following', label: '关注', show: true },
  ];

  return (
    <div className="flex gap-4 border-b mb-6">
      {tabs.map((tab) => (
        tab.show && (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'pb-3 px-1 text-sm font-medium transition-colors relative',
              activeTab === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )
      ))}
    </div>
  );
}
