'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { ProfileHeader } from '@/components/user/profile-header';
import { FollowList } from '@/components/user/follow-list';
import { ProfileHeaderSkeleton, ArticleListSkeleton } from '@/components/loading/skeleton';
import { ArticleList } from '@/components/article/article-list';
import { CollectionList } from '@/components/collections/collection-list';
import { useAuth } from '@/hooks/use-auth';
import { useCollections } from '@/hooks/use-collections';
import { userApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ArticleWithAuthor } from '@/types';
import type { User } from '@jianshu/shared';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const { collections, isLoading: isCollectionsLoading } = useCollections();

  const [activeTab, setActiveTab] = useState<'articles' | 'collections' | 'followers' | 'following'>('articles');

  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.user(username),
    queryFn: () => userApi.getByUsername(username),
    enabled: !!username,
  });

  const { data: articlesRes, isLoading: isArticlesLoading } = useQuery({
    queryKey: queryKeys.userArticles(username),
    queryFn: () => userApi.getArticles(username, { page: 1, limit: 20 }),
    enabled: !!username,
  });

  const profile = profileRes?.data;
  const articles = articlesRes?.data?.items || [];
  const isLoading = isProfileLoading || isArticlesLoading;

  const isOwnProfile = currentUser?.username === profile?.username;

  if (isLoading) {
    return (
      <PageLayout>
        <ProfileHeaderSkeleton />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <ArticleListSkeleton count={5} />
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">用户不存在</h1>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ProfileHeader user={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <main className="flex-1">
            {/* Tab Navigation */}
            <div className="flex gap-4 border-b mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('articles')}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'articles'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                文章
              </button>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setActiveTab('collections')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'collections'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  收藏集
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('followers')}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'followers'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                粉丝
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('following')}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'following'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                关注
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'articles' ? (
              <ArticleList articles={articles} />
            ) : activeTab === 'collections' ? (
              <CollectionList
                collections={currentUser ? collections : []}
                isOwner={isOwnProfile}
                isLoading={isCollectionsLoading}
              />
            ) : activeTab === 'followers' ? (
              <FollowList username={profile.username} type="followers" />
            ) : activeTab === 'following' ? (
              <FollowList username={profile.username} type="following" />
            ) : null}
          </main>

          <aside className="hidden md:block w-64">
            <div className="sticky top-20">
              <h3 className="font-semibold text-foreground mb-4">个人介绍</h3>
              <p className="text-muted-foreground text-sm">
                {profile.bio || '暂无个人介绍'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}