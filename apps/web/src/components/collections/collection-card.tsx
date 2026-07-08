'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collection } from '@/lib/api';

interface CollectionCardProps {
  collection: Collection;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export function CollectionCard({ collection, isOwner, onDelete }: CollectionCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      {/* Preview Images */}
      <div className="aspect-[3/1] bg-muted relative overflow-hidden">
        {collection.previewItems.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-4 gap-0.5">
            {collection.previewItems.slice(0, 4).map((item, index) => (
              <div
                key={item.id}
                className="bg-muted overflow-hidden"
                style={{
                  backgroundImage: item.coverImage ? `url(${item.coverImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">暂无文章</span>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {collection.description}
              </p>
            )}
          </div>
          {!collection.isPublic && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded flex-shrink-0">
              私有
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          {collection.articleCount} 篇文章
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/user/collections/${collection.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            查看
          </Button>
        </Link>
        {isOwner && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(collection.id)}
          >
            删除
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
