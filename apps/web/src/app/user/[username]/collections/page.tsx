'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ProfileHeader } from '@/components/user/profile-header';
import { ProfileHeaderSkeleton } from '@/components/loading/skeleton';
import { CollectionList } from '@/components/collections/collection-list';
import { useAuth } from '@/hooks/use-auth';
import { useCollections } from '@/hooks/use-collections';
import { userApi } from '@/lib/api';
import type { User } from '@jianshu/shared';

export default function UserCollectionsPage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const { collections, isLoading, deleteCollection, isDeleting } = useCollections();

  const [profile, setProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      try {
        const res = await userApi.getByUsername(username);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const isOwnProfile = currentUser?.username === profile?.username;
  const isOwner = currentUser?.username === username;

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个收藏集吗？')) {
      deleteCollection(id);
    }
  };

  if (isProfileLoading) {
    return (
      <PageLayout>
        <ProfileHeaderSkeleton />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/1] bg-muted rounded-t-lg" />
                <div className="p-4 space-y-2 bg-card rounded-b-lg border border-t-0">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
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

  return (
    <PageLayout>
      <ProfileHeader user={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">我的收藏集</h2>
        </div>

        <CollectionList
          collections={collections}
          isOwner={isOwner}
          isLoading={isLoading}
          onDelete={isOwner ? handleDelete : undefined}
        />
      </div>
    </PageLayout>
  );
}
