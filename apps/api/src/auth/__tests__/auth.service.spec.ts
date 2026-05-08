import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: '$2a$10$hashedpassword',
    bio: null,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            refreshToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.user.create = jest.fn().mockResolvedValue(mockUser);
      prismaService.refreshToken.create = jest.fn().mockResolvedValue({
        token: 'refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
        username: 'testuser',
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('jwt-token');
      expect(result.data.refreshToken).toBeDefined();
      expect(typeof result.data.refreshToken).toBe('string');
      expect(result.data.refreshToken.length).toBeGreaterThan(0);
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.user.password).toBeUndefined();
    });

    it('should throw ConflictException if email exists', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: '123456',
          name: 'Test User',
          username: 'testuser',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username exists', async () => {
      // First call (email check) returns null, second call (username check) returns mockUser
      prismaService.user.findUnique = jest.fn()
        .mockResolvedValueOnce(null) // email check - not found
        .mockResolvedValueOnce(mockUser); // username check - found

      await expect(
        authService.register({
          email: 'new@example.com',
          password: '123456',
          name: 'Test User',
          username: 'testuser',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      prismaService.refreshToken.create = jest.fn().mockResolvedValue({
        token: 'refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('jwt-token');
      expect(result.data.refreshToken).toBeDefined();
      expect(typeof result.data.refreshToken).toBe('string');
      expect(result.data.refreshToken.length).toBeGreaterThan(0);
      expect(result.data.user.password).toBeUndefined();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: '123456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('should return user data without password', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.me('user-123');

      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
      expect((result.data as any).password).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.me('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshToken = {
        id: 'token-id',
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: 'user-123',
        user: mockUser,
      };
      prismaService.refreshToken.findUnique = jest.fn().mockResolvedValue(mockRefreshToken);
      prismaService.refreshToken.delete = jest.fn().mockResolvedValue(mockRefreshToken);
      prismaService.refreshToken.create = jest.fn().mockResolvedValue({
        token: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('jwt-token');
      expect(result.data.refreshToken).toBeDefined();
      expect(typeof result.data.refreshToken).toBe('string');
      expect(result.data.refreshToken.length).toBeGreaterThan(0);
      expect(result.data.user.email).toBe('test@example.com');
      expect(prismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      prismaService.refreshToken.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        authService.refreshTokens('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // already expired
        userId: 'user-123',
        user: mockUser,
      };
      prismaService.refreshToken.findUnique = jest.fn().mockResolvedValue(expiredToken);

      await expect(
        authService.refreshTokens('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      prismaService.refreshToken.deleteMany = jest.fn().mockResolvedValue({ count: 3 });

      const result = await authService.logout('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });
});
