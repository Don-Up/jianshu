import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { ArticleWithAuthor } from '@/types';

interface ArticleCardProps {
  article: ArticleWithAuthor;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/user/${article.author.username}`;
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={article.author.avatar || undefined} />
                    <AvatarFallback>
                      {article.author.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground hover:text-foreground">
                    {article.author.name}
                  </span>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{formatDate(article.createdAt)}</span>
              </div>

              <h2 className="text-xl font-semibold text-foreground hover:text-primary mb-2 line-clamp-2">
                {article.title}
              </h2>

              {article.excerpt && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{article.excerpt}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {article.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {article.commentCount}
                </span>
              </div>
            </div>

            {article.coverImage && (
              <div className="hidden sm:block w-32 h-24 flex-shrink-0">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}