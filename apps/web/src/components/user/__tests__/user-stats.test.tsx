import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserStats } from '../user-stats';

describe('UserStats', () => {
  it('should render follower count', () => {
    render(<UserStats followersCount={100} followingCount={50} articlesCount={25} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('粉丝')).toBeInTheDocument();
  });

  it('should render following count', () => {
    render(<UserStats followersCount={100} followingCount={50} articlesCount={25} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('关注')).toBeInTheDocument();
  });

  it('should render article count', () => {
    render(<UserStats followersCount={100} followingCount={50} articlesCount={25} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('文章')).toBeInTheDocument();
  });

  it('should render 0 when counts are undefined', () => {
    render(<UserStats followersCount={0} followingCount={0} articlesCount={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render 0 when counts are null', () => {
    render(<UserStats followersCount={undefined as any} followingCount={undefined as any} articlesCount={undefined as any} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
