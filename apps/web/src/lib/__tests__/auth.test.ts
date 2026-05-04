import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getToken, setToken, getUser, setUser, clearAuth, isAuthenticated } from '../auth';

const TEST_TOKEN = 'test-token-123';
const TEST_USER = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  createdAt: new Date('2024-01-01'),
};

describe('auth utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getToken / setToken', () => {
    it('should return null when no token is stored', () => {
      expect(getToken()).toBeNull();
    });

    it('should store and retrieve token', () => {
      setToken(TEST_TOKEN);
      expect(getToken()).toBe(TEST_TOKEN);
    });
  });

  describe('getUser / setUser', () => {
    it('should return null when no user is stored', () => {
      expect(getUser()).toBeNull();
    });

    it('should store and retrieve user', () => {
      setUser(TEST_USER);
      const user = getUser();
      expect(user).not.toBeNull();
      expect(user?.id).toBe(TEST_USER.id);
      expect(user?.email).toBe(TEST_USER.email);
      expect(user?.username).toBe(TEST_USER.username);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('jianshu_user', 'invalid json');
      expect(getUser()).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should clear both token and user', () => {
      setToken(TEST_TOKEN);
      setUser(TEST_USER);
      clearAuth();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      setToken(TEST_TOKEN);
      expect(isAuthenticated()).toBe(true);
    });
  });
});
