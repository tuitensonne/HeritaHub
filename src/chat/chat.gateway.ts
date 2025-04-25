import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatPrivateMessageDto } from './dto/chat-private.dto';
import { ChatGroupMessageDto } from './dto/chat-group.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Khởi tạo');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ngắt kết nối: ${client.id}`);
  }

  // Cho phép client tham gia phòng cá nhân dựa trên userId
  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(userId); // Tham gia phòng có tên là userId
    this.logger.log(`Client ${client.id} tham gia phòng: ${userId}`);
    return { status: 'Đã tham gia phòng', userId };
  }

  // Xử lý tin nhắn riêng
  @SubscribeMessage('send_private_message')
  async handlePrivateMessage(@MessageBody() data: ChatPrivateMessageDto) {
    try {
      // Gọi ChatService để lưu tin nhắn và áp dụng logic nghiệp vụ
      const message = await this.chatService.sendPrivateMessage(
        data.senderId,
        data.receiverId,
        data.content,
      );

      // Phát tin nhắn đến người gửi và người nhận
      this.server.to(data.senderId).emit('new_private_message', message);
      this.server.to(data.receiverId).emit('new_private_message', message);

      return message;
    } catch (error) {
      this.logger.error(`Lỗi khi gửi tin nhắn riêng: ${error.message}`);
      throw error;
    }
  }

  // Xử lý tin nhắn nhóm
  @SubscribeMessage('send_group_message')
  async handleGroupMessage(@MessageBody() data: ChatGroupMessageDto) {
    try {
      // Gọi ChatService để lưu tin nhắn nhóm
      const message = await this.chatService.sendGroupMessage(
        data.senderId,
        data.groupId,
        data.content,
      );

      // Lấy danh sách thành viên nhóm
      const groupMembers = await this.chatService.prisma.groupMember.findMany({
        where: { group_id: data.groupId },
        select: { user_id: true },
      });

      // Phát tin nhắn đến tất cả thành viên nhóm
      groupMembers.forEach((member) => {
        this.server.to(member.user_id).emit('new_group_message', message);
      });

      return message;
    } catch (error) {
      this.logger.error(`Lỗi khi gửi tin nhắn nhóm: ${error.message}`);
      throw error;
    }
  }

  // Xử lý tham gia nhóm
  @SubscribeMessage('join_group')
  async handleJoinGroup(
    client: Socket,
    data: { userId: string; groupId: string },
  ) {
    try {
      // Gọi ChatService để thêm người dùng vào nhóm
      await this.chatService.joinGroup(data.userId, data.groupId);

      // Tham gia phòng WebSocket của nhóm
      client.join(data.groupId);
      this.logger.log(`Client ${client.id} tham gia nhóm: ${data.groupId}`);

      // Thông báo đến các thành viên nhóm
      const groupMembers = await this.chatService.prisma.groupMember.findMany({
        where: { group_id: data.groupId },
        select: { user_id: true },
      });
      groupMembers.forEach((member) => {
        this.server.to(member.user_id).emit('user_joined_group', {
          userId: data.userId,
          groupId: data.groupId,
        });
      });

      return { status: 'Đã tham gia nhóm', groupId: data.groupId };
    } catch (error) {
      this.logger.error(`Lỗi khi tham gia nhóm: ${error.message}`);
      throw error;
    }
  }

  // Xử lý rời nhóm
  @SubscribeMessage('leave_group')
  async handleLeaveGroup(
    client: Socket,
    data: { userId: string; groupId: string },
  ) {
    try {
      // Xóa người dùng khỏi nhóm trong cơ sở dữ liệu
      await this.chatService.prisma.groupMember.deleteMany({
        where: { user_id: data.userId, group_id: data.groupId },
      });

      // Rời phòng WebSocket của nhóm
      client.leave(data.groupId);
      this.logger.log(`Client ${client.id} rời nhóm: ${data.groupId}`);

      // Thông báo đến các thành viên nhóm
      const groupMembers = await this.chatService.prisma.groupMember.findMany({
        where: { group_id: data.groupId },
        select: { user_id: true },
      });
      groupMembers.forEach((member) => {
        this.server.to(member.user_id).emit('user_left_group', {
          userId: data.userId,
          groupId: data.groupId,
        });
      });

      return { status: 'Đã rời nhóm', groupId: data.groupId };
    } catch (error) {
      this.logger.error(`Lỗi khi rời nhóm: ${error.message}`);
      throw error;
    }
  }

  // Xử lý tạo nhóm
  @SubscribeMessage('create_group')
  async handleCreateGroup(
    @MessageBody()
    data: {
      creatorId: string;
      groupName: string;
      memberIds: string[];
    },
  ) {
    try {
      // Gọi ChatService để tạo nhóm
      const group = await this.chatService.createGroup(
        data.creatorId,
        data.groupName,
        data.memberIds,
      );

      // Thông báo đến tất cả thành viên nhóm (bao gồm người tạo)
      const allMembers = [data.creatorId, ...data.memberIds];
      allMembers.forEach((userId) => {
        this.server.to(userId).emit('group_created', group);
      });

      return group;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo nhóm: ${error.message}`);
      throw error;
    }
  }
}
