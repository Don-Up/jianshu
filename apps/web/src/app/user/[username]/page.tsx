'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ProfileHeader } from '@/components/user/profile-header';
import { ArticleList } from '@/components/article/article-list';
import { useAuth } from '@/hooks/use-auth';
import { userApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';
import type { User } from '@jianshu/shared';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="animate-pulse">
          <div className="h-40 bg-muted" />
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
            <h2 className="text-lg font-semibold text-foreground mb-4">文章</h2>
            <ArticleList articles={articles} />
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