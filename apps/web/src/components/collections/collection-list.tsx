'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CollectionCard } from './collection-card';
import { CreateCollectionDialog } from './create-collection-dialog';
import { Collection } from '@/lib/api';

interface CollectionListProps {
  collections: Collection[];
  isOwner?: boolean;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function CollectionList({
  collections,
  isOwner,
  isLoading,
  onDelete,
}: CollectionListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      {collections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">还没有收藏集</p>
          {isOwner && (
            <Button onClick={() => setShowCreateDialog(true)}>
              创建第一个收藏集
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              isOwner={isOwner}
              onDelete={onDelete}
            />
          ))}

          {isOwner && (
            <div
              className="border-2 border-dashed border-muted rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-muted-foreground">新建收藏集</span>
            </div>
          )}
        </div>
      )}

      <CreateCollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
