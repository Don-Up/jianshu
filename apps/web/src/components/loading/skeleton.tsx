export function Skeleton({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) {
  return (
    <div
      data-testid={testId || 'skeleton'}
      className={`animate-pulse rounded-md bg-muted ${className || ''}`}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div data-testid="article-card-skeleton" className="border-b border-border p-4">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div data-testid="profile-header-skeleton" className="bg-background border-b p-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticleEditorSkeleton() {
  return (
    <div data-testid="article-editor-skeleton" className="max-w-3xl mx-auto">
      <div className="border rounded-md p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    </div>
  );
}
