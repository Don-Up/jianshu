'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCollections } from '@/hooks/use-collections';
import { useAuth } from '@/hooks/use-auth';
import type { Collection } from '@/lib/api';

interface AddToCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleSlug: string;
  articleId?: string;
}

export function AddToCollectionModal({ open, onOpenChange, articleSlug }: AddToCollectionModalProps) {
  const { collections, isLoading, addArticle, isAddingArticle } = useCollections();
  const { user } = useAuth();
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const handleAddToCollection = (collectionId: string) => {
    addArticle(
      { collectionId, slug: articleSlug },
      {
        onSuccess: () => {
          setAddedTo((prev) => new Set([...prev, collectionId]));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>添加到收藏集</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-muted rounded" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              还没有收藏集，{user ? (
                <Link href={`/user/${user.username}/collections`} className="text-primary hover:underline">
                  去创建
                </Link>
              ) : (
                <span>去创建</span>
              )}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {collection.articleCount} 篇文章
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={addedTo.has(collection.id) ? 'secondary' : 'outline'}
                    onClick={() => handleAddToCollection(collection.id)}
                    disabled={isAddingArticle || addedTo.has(collection.id)}
                  >
                    {addedTo.has(collection.id) ? '已添加' : '添加'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
