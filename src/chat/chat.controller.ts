import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Lấy lịch sử tin nhắn riêng giữa hai người dùng
  @Get('private/:userId1/:userId2')
  async getPrivateMessages(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    return this.chatService.getMessagesWithUser(userId1, userId2);
  }

  @Get('group/:groupId')
  async getGroupMessages(@Param('groupId') groupId: string) {
    return this.chatService.getGroupMessages(groupId);
  }

  @Get('conversations/:userId')
  async getPrivateConversations(@Param('userId') userId: string) {
    return this.chatService.getPrivateConversations(userId);
  }

  @Get('conversations/group')
  async getGroupConversations(@Req() req) {
    return this.chatService.getGroupConversations(req.user.id);
  }

  @Get('groups/:userId')
  async getUserGroups(@Param('userId') userId: string) {
    return this.chatService.getUserGroups(userId);
  }

  @Post('group/:groupId/join')
  async joinGroup(@Req() req, @Param('groupId') groupId: string) {
    return this.chatService.joinGroup(req.user.id, groupId);
  }

  @Post('create-group')
  @UsePipes(new ValidationPipe())
  async createGroup(
    @Body('creatorId') creatorId: string,
    @Body('groupName') groupName: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.chatService.createGroup(creatorId, groupName, memberIds);
  }
}
