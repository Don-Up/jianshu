import { HistoryItem } from './history-item';
import type { HistoryItem as HistoryItemType } from '@/lib/api';

interface HistoryListProps {
  items: HistoryItemType[];
  isLoading?: boolean;
  onRemoveItem: (articleId: string) => void;
}

export function HistoryList({ items = [], isLoading, onRemoveItem }: HistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-muted-foreground">还没有阅读历史</p>
        <p className="text-sm text-muted-foreground mt-1">快去阅读一些文章吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HistoryItem key={item.article.id} item={item} onRemove={onRemoveItem} />
      ))}
    </div>
  );
}
