import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'socket.io';
import { NotificationsGateway } from '../notifications.gateway';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { CanActivate } from '@nestjs/common';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockServer: jest.Mocked<Server>;

  const createMockClient = (userId?: string): any => ({
    id: 'socket-id',
    join: jest.fn(),
    leave: jest.fn(),
    data: {
      user: userId ? { id: userId, email: 'test@example.com' } : undefined,
    },
  });

  // Mock guard that allows all authenticated requests
  const mockWsJwtGuard: CanActivate = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: WsJwtGuard,
          useValue: mockWsJwtGuard,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    // Manually set the server
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const consoleSpy = jest.spyOn(gateway['logger'], 'log');
      const client = createMockClient();

      gateway.handleConnection(client);

      expect(consoleSpy).toHaveBeenCalledWith('Client connected: socket-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const consoleSpy = jest.spyOn(gateway['logger'], 'log');
      const client = createMockClient();

      gateway.handleDisconnect(client);

      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected: socket-id');
    });
  });

  describe('handleJoin', () => {
    it('should add client to user room when user is authenticated', () => {
      const client = createMockClient('user-123');

      const result = gateway.handleJoin({}, client);

      expect(client.join).toHaveBeenCalledWith('user:user-123');
      expect(result).toEqual({ event: 'joined', data: { userId: 'user-123' } });
    });

    it('should return error when user not authenticated', () => {
      const client = createMockClient(); // no user data

      const result = gateway.handleJoin({}, client);

      expect(client.join).not.toHaveBeenCalled();
      expect(result).toEqual({
        event: 'error',
        data: { message: 'User not authenticated' },
      });
    });
  });

  describe('handleLeave', () => {
    it('should remove client from user room when authenticated', () => {
      const client = createMockClient('user-123');

      const result = gateway.handleLeave({}, client);

      expect(client.leave).toHaveBeenCalledWith('user:user-123');
      expect(result).toEqual({ event: 'left', data: { userId: 'user-123' } });
    });

    it('should not call leave when user not authenticated', () => {
      const client = createMockClient(); // no user data

      const result = gateway.handleLeave({}, client);

      expect(client.leave).not.toHaveBeenCalled();
    });
  });

  describe('notifyUser', () => {
    it('should emit notification to user room', () => {
      const notification = {
        id: 'notif-123',
        type: 'LIKE',
        message: 'Someone liked your article',
        userId: 'user-456',
        createdAt: new Date(),
      };

      gateway.notifyUser('user-456', notification);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-456');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });

    it('should emit to correct user room only', () => {
      const notification = {
        id: 'notif-123',
        type: 'COMMENT',
        message: 'Someone commented',
        userId: 'user-789',
      };

      gateway.notifyUser('user-789', notification);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-789');
      expect(mockServer.to).not.toHaveBeenCalledWith('user:user-123');
    });
  });

  describe('broadcastNotification', () => {
    it('should broadcast notification to all connected clients', () => {
      const notification = {
        id: 'notif-sys',
        type: 'SYSTEM',
        message: 'System maintenance scheduled',
      };

      gateway.broadcastNotification(notification);

      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });
  });
});
