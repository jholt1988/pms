
import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagingService } from './messaging.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('messaging')
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  getConversations(@Request() req: AuthenticatedRequest) {
    return this.messagingService.getConversations(req.user.userId);
  }

  @Get('conversations/:id')
  getConversationMessages(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagingService.getConversationMessages(Number(id), req.user.userId);
  }

  @Post('conversations')
  createConversation(@Body() body: { recipientId: number }, @Request() req: AuthenticatedRequest) {
    return this.messagingService.createConversation(req.user.userId, body.recipientId);
  }

  @Post('messages')
  sendMessage(@Body() body: { conversationId: number; content: string }, @Request() req: AuthenticatedRequest) {
    return this.messagingService.sendMessage(req.user.userId, body.conversationId, body.content);
  }
}
