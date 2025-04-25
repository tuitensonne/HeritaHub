import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    await client.join(userId);
    console.log(`User connected: ${userId}`);
  }

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @MessageBody()
    data: {
      senderId: string;
      receiverId: string;
      content: string;
    },
  ) {
    const message = await this.chatService.sendPrivateMessage(
      data.senderId,
      data.receiverId,
      data.content,
    );
    this.server.to(data.receiverId).emit('privateMessage', message);
  }

  @SubscribeMessage('groupMessage')
  async handleGroupMessage(
    @MessageBody() data: { senderId: string; groupId: string; content: string },
  ) {
    const message = await this.chatService.sendGroupMessage(
      data.senderId,
      data.groupId,
      data.content,
    );
    this.server.to(`group-${data.groupId}`).emit('groupMessage', message);
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @MessageBody() groupId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`group-${groupId}`);
    console.log(`Client joined group: ${groupId}`);
  }
}
