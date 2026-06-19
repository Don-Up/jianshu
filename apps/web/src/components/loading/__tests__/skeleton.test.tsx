import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  ArticleCardSkeleton,
  ArticleListSkeleton,
  ProfileHeaderSkeleton,
  ArticleEditorSkeleton,
} from '../skeleton';

describe('Skeleton components', () => {
  describe('Skeleton', () => {
    it('should render skeleton with custom className', () => {
      render(<Skeleton className="h-10 w-10" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('ArticleCardSkeleton', () => {
    it('should render article card skeleton', () => {
      render(<ArticleCardSkeleton />);
      const skeleton = screen.getByTestId('article-card-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('ArticleListSkeleton', () => {
    it('should render default 5 article skeletons', () => {
      render(<ArticleListSkeleton />);
      const skeletons = screen.getAllByTestId('article-card-skeleton');
      expect(skeletons).toHaveLength(5);
    });

    it('should render custom count of skeletons', () => {
      render(<ArticleListSkeleton count={3} />);
      const skeletons = screen.getAllByTestId('article-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('ProfileHeaderSkeleton', () => {
    it('should render profile header skeleton', () => {
      render(<ProfileHeaderSkeleton />);
      const skeleton = screen.getByTestId('profile-header-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('ArticleEditorSkeleton', () => {
    it('should render article editor skeleton', () => {
      render(<ArticleEditorSkeleton />);
      const skeleton = screen.getByTestId('article-editor-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
