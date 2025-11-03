
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: { include: { user: true } } },
    });
  }

  async getConversationMessages(conversationId: number, userId: number) {
    // Add validation to ensure the user is a participant of the conversation
    return this.prisma.message.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createConversation(userId: number, recipientId: number) {
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
    });
  }

  async sendMessage(senderId: number, conversationId: number, content: string) {
    // Add validation to ensure the sender is a participant of the conversation
    return this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content,
      },
    });
  }
}
