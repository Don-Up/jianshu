import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email: string;
    };
  };
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('NotificationsGateway');

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  @UseGuards(WsJwtGuard)
  handleJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.user?.id;
    if (!userId) {
      return { event: 'error', data: { message: 'User not authenticated' } };
    }

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} joined their notification room`);
    return { event: 'joined', data: { userId } };
  }

  @SubscribeMessage('leave')
  @UseGuards(WsJwtGuard)
  handleLeave(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.data.user?.id;
    if (userId) {
      client.leave(`user:${userId}`);
      this.logger.log(`User ${userId} left their notification room`);
    }
    return { event: 'left', data: { userId } };
  }

  // Called by NotificationsService to push notifications to users
  notifyUser(userId: string, notification: any) {
    this.logger.log(`Sending notification to user:${userId}`);
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Broadcast to all connected clients (for system notifications)
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
  }
}
