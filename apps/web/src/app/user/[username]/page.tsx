'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { ProfileHeader } from '@/components/user/profile-header';
import { FollowList } from '@/components/user/follow-list';
import { ProfileHeaderSkeleton, ArticleListSkeleton } from '@/components/loading/skeleton';
import { ArticleList } from '@/components/article/article-list';
import { CollectionList } from '@/components/collections/collection-list';
import { useAuth } from '@/hooks/use-auth';
import { useCollections } from '@/hooks/use-collections';
import { userApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';
import type { User } from '@jianshu/shared';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const { collections, isLoading: isCollectionsLoading } = useCollections();

  const [profile, setProfile] = useState<User | null>(null);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'collections' | 'followers' | 'following'>('articles');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, articlesRes] = await Promise.all([
          userApi.getByUsername(username),
          userApi.getArticles(username, { page: 1, limit: 20 }),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setError('User not found');
        }

        if (articlesRes.success && articlesRes.data) {
          setArticles(articlesRes.data.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]);

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

  if (error || !profile) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">用户不存在</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

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