
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    await this.ensureConversationParticipant(conversationId, userId);
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
    await this.ensureConversationParticipant(conversationId, senderId);
    return this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content,
      },
    });
  }

  private async ensureConversationParticipant(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
  }
}
