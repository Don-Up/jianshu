import { describe, it, expect } from 'vitest';
import { queryKeys } from '../query-keys';

describe('queryKeys', () => {
  describe('auth', () => {
    it('should have correct auth base key', () => {
      expect(queryKeys.auth).toEqual(['auth']);
    });

    it('should have correct authMe key', () => {
      expect(queryKeys.authMe()).toEqual(['auth', 'me']);
    });
  });

  describe('articles', () => {
    it('should have correct articles base key', () => {
      expect(queryKeys.articles).toEqual(['articles']);
    });

    it('should generate correct article key with slug', () => {
      expect(queryKeys.article('test-slug')).toEqual(['articles', 'test-slug']);
    });
  });

  describe('users', () => {
    it('should have correct users base key', () => {
      expect(queryKeys.users).toEqual(['users']);
    });

    it('should generate correct user key with username', () => {
      expect(queryKeys.user('testuser')).toEqual(['users', 'testuser']);
    });

    it('should generate correct userArticles key with username', () => {
      expect(queryKeys.userArticles('testuser')).toEqual(['users', 'testuser', 'articles']);
    });
  });

  describe('notifications', () => {
    it('should have correct notifications key', () => {
      expect(queryKeys.notifications).toEqual(['notifications']);
    });
  });
});
