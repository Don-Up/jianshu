'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchFilters } from '@/components/search/search-filters';
import { useSearch } from '@/hooks/use-search';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const {
    articles,
    isLoading,
    error,
    hasMore,
    loadMore,
    sortBy,
    dateRange,
    setSortBy,
    setDateRange,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useSearch(query);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('q') as string;
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!query) {
    return (
      <div className="space-y-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            name="q"
            type="search"
            placeholder="搜索文章..."
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit">搜索</Button>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground">最近搜索</h2>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                清除
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(search)}`)}
                  className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {recentSearches.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground">输入关键词搜索文章</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">搜索失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          name="q"
          type="search"
          placeholder="搜索文章..."
          defaultValue={query}
          className="flex-1"
        />
        <Button type="submit">搜索</Button>
      </form>

      {/* Search Filters */}
      <SearchFilters
        sortBy={sortBy}
        dateRange={dateRange}
        onSortChange={setSortBy}
        onDateRangeChange={setDateRange}
      />

      {/* Results */}
      {articles.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground">没有找到相关文章</p>
          <p className="text-sm text-muted-foreground mt-1">试试其他关键词</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            找到 {articles.length > 0 ? '约' : ''}{articles.length} 个结果
          </div>
          <ArticleList articles={articles} isLoading={isLoading} />
          {hasMore && (
            <div className="py-4 text-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">搜索</h1>
        </div>
        <Suspense fallback={<SearchFallback />}>
          <SearchContent />
        </Suspense>
      </div>
    </PageLayout>
  );
}
