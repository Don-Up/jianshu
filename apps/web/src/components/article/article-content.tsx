import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { ArticleWithAuthor } from '@/types';

interface ArticleContentProps {
  article: ArticleWithAuthor;
  onLike?: () => void;
  isLiking?: boolean;
}

export function ArticleContent({ article, onLike, isLiking }: ArticleContentProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={article.author.avatar || undefined} />
              <AvatarFallback>
                {article.author.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{article.author.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(article.createdAt)} · {article.readCount} 阅读
              </p>
            </div>
          </div>

          <Button
            variant={article.isLiked ? 'default' : 'secondary'}
            size="sm"
            onClick={onLike}
            disabled={isLiking}
          >
            <svg className="w-4 h-4 mr-1" fill={article.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {article.likeCount}
          </Button>
        </div>

        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose-jianshu"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}