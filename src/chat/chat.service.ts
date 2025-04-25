import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendPrivateMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    const senderFollowsReceiver = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { following: true },
    });

    const receiverFollowsSender = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { following: true },
    });

    if (
      senderFollowsReceiver?.following === 0 ||
      receiverFollowsSender?.following === 0
    ) {
      throw new Error(
        'Both users must follow each other to send a private message.',
      );
    }

    return await this.prisma.chat.create({
      data: {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        type: 'PRIVATE',
        status: 'SENT',
      },
    });
  }

  async sendGroupMessage(senderId: string, groupId: string, content: string) {
    return await this.prisma.chat.create({
      data: {
        sender_id: senderId,
        group_id: groupId,
        content,
        type: 'GROUP',
        status: 'SENT',
      },
    });
  }

  async getMessagesWithUser(userId1: string, userId2: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [
          { sender_id: userId1, receiver_id: userId2 },
          { sender_id: userId2, receiver_id: userId1 },
        ],
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        content: true,
        sender_id: true,
        receiver_id: true,
        created_at: true,
        type: true,
        status: true,
      },
    });
  }

  async getGroupMessages(groupId: string) {
    return await this.prisma.chat.findMany({
      where: { group_id: groupId },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        content: true,
        sender_id: true,
        receiver_id: true,
        created_at: true,
        type: true,
        status: true,
      },
    });
  }

  async getPrivateConversations(userId: string) {
    const messages = await this.prisma.chat.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
        type: 'PRIVATE',
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        sender_id: true,
        receiver_id: true,
        content: true,
        created_at: true,
      },
    });

    const conversationMap = new Map<
      string,
      {
        content: string;
        created_at: Date;
        fromSelf: boolean;
      }
    >();

    for (const msg of messages) {
      const otherUserId =
        msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      if (otherUserId && !conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          content: msg.content,
          created_at: msg.created_at,
          fromSelf: msg.sender_id === userId,
        });
      }
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: [...conversationMap.keys()] },
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
      },
    });

    return users.map((user) => {
      const lastMsg = conversationMap.get(user.id);
      return {
        ...user,
        lastMessage: lastMsg?.content,
        lastMessageTime: lastMsg?.created_at,
        fromSelf: lastMsg?.fromSelf,
      };
    });
  }

  async getUserGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: {
        members: {
          some: { user_id: userId },
        },
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        chats: {
          where: {
            type: 'GROUP',
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
          select: {
            content: true,
            created_at: true,
            sender_id: true,
          },
        },
      },
    });

    return groups.map((group) => {
      const lastMessage = group.chats[0];
      return {
        id: group.id,
        name: group.name,
        created_at: group.created_at,
        lastMessage: lastMessage?.content || null,
        lastMessageTime: lastMessage?.created_at || null,
        fromSelf: lastMessage?.sender_id === userId,
      };
    });
  }
}
