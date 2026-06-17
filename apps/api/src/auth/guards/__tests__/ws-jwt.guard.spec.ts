import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from '../ws-jwt.guard';
import { Socket } from 'socket.io';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: jest.Mocked<JwtService>;

  const mockPayload = { sub: 'user-123', email: 'test@example.com' };

  const createMockSocket = (options: {
    authToken?: string;
    queryToken?: string;
  }): Partial<Socket> => ({
    handshake: {
      headers: {
        authorization: options.authToken
          ? `Bearer ${options.authToken}`
          : undefined,
      },
      query: {
        token: options.queryToken,
      },
    },
    data: {},
  } as any);

  const createMockExecutionContext = (socket: Partial<Socket>): ExecutionContext => ({
    switchToWs: () => ({
      getClient: () => socket,
    }),
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow valid Bearer token in header', async () => {
      const mockSocket = createMockSocket({ authToken: 'valid-token' });
      const context = createMockExecutionContext(mockSocket);
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: expect.any(String),
      });
      expect(mockSocket.data.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should allow valid token in query parameter', async () => {
      const mockSocket = createMockSocket({ queryToken: 'query-token' });
      const context = createMockExecutionContext(mockSocket);
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('query-token', {
        secret: expect.any(String),
      });
    });

    it('should prefer Bearer header over query token', async () => {
      const mockSocket = createMockSocket({
        authToken: 'header-token',
        queryToken: 'query-token',
      });
      const context = createMockExecutionContext(mockSocket);
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', {
        secret: expect.any(String),
      });
    });

    it('should throw WsException when no token provided', async () => {
      const mockSocket = createMockSocket({});
      const context = createMockExecutionContext(mockSocket);

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Unauthorized: No token provided',
      );
    });

    it('should throw WsException when token is invalid', async () => {
      const mockSocket = createMockSocket({ authToken: 'invalid-token' });
      const context = createMockExecutionContext(mockSocket);
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Unauthorized: Invalid token',
      );
    });

    it('should attach user data to socket on success', async () => {
      const mockSocket = createMockSocket({ authToken: 'valid-token' });
      const context = createMockExecutionContext(mockSocket);
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(context);

      expect(mockSocket.data).toHaveProperty('user');
      expect(mockSocket.data.user.id).toBe('user-123');
      expect(mockSocket.data.user.email).toBe('test@example.com');
    });
  });
});
