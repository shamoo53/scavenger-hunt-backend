import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UseGuards } from '@nestjs/common';
  import { AuthGuard } from '../auth/guards/auth.guard';
  import { Notification } from './entities/notification.entity';
  
  @WebSocketGateway({
    cors: {
      origin: '*', // In production, restrict this to your frontend domain
    },
    namespace: '/notifications',
  })
  export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    // Map to store user connections - userId -> socketId[]
    private userSockets: Map<string, Set<string>> = new Map();
  
    async handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
      // Authentication will be handled when the client emits 'register'
    }
  
    async handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
      // Remove the socket from our userSockets map
      this.removeSocketFromUser(client.id);
    }
  
    private removeSocketFromUser(socketId: string) {
      for (const [userId, sockets] of this.userSockets.entries()) {
        if (sockets.has(socketId)) {
          sockets.delete(socketId);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
          break;
        }
      }
    }
  
    @UseGuards(AuthGuard)
    @SubscribeMessage('register')
    handleRegister(
      @MessageBody() userId: string,
      @ConnectedSocket() client: Socket,
    ) {
      console.log(`Registering user ${userId} with socket ${client.id}`);
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      
      this.userSockets.get(userId).add(client.id);
      
      return { status: 'registered' };
    }
  
    // Method to send notification to a specific user
    sendNotificationToUser(userId: string, notification: Notification) {
      const userSocketIds = this.userSockets.get(userId);
      
      if (userSocketIds && userSocketIds.size > 0) {
        userSocketIds.forEach(socketId => {
          this.server.to(socketId).emit('notification', notification);
        });
      }
    }
  
    // Method to broadcast to all connected clients (for system-wide announcements)
    broadcastNotification(notification: Notification) {
      this.server.emit('notification', notification);
    }
  }