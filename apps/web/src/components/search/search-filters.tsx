'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'relevance' | 'date';
export type DateRange = 'all' | 'day' | 'week' | 'month' | 'year';

interface SearchFiltersProps {
  sortBy: SortOption;
  dateRange: DateRange;
  onSortChange: (sort: SortOption) => void;
  onDateRangeChange: (range: DateRange) => void;
}

export function SearchFilters({ sortBy, dateRange, onSortChange, onDateRangeChange }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: '相关性' },
    { value: 'date', label: '最新发布' },
  ];

  const dateOptions: { value: DateRange; label: string }[] = [
    { value: 'all', label: '全部时间' },
    { value: 'day', label: '一天内' },
    { value: 'week', label: '一周内' },
    { value: 'month', label: '一月内' },
    { value: 'year', label: '一年内' },
  ];

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Sort Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
            'hover:bg-muted/50',
            isOpen && 'bg-muted'
          )}
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span className="text-muted-foreground">
            {sortOptions.find(o => o.value === sortBy)?.label}
          </span>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 rounded-md border bg-background shadow-lg z-10">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  sortBy === option.value ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Buttons */}
      <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-muted/50">
        {dateOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDateRangeChange(option.value)}
            className={cn(
              'px-2 py-1 text-xs rounded transition-colors',
              dateRange === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Click outside handler hook
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}
