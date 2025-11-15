import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagingService } from './messaging.service';
import {
  CreateMessageDto,
  CreateConversationDto,
  GetConversationsQueryDto,
  GetMessagesQueryDto,
} from './dto/messaging.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

@Controller('api/messaging')
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Get all conversations for the authenticated user
   * GET /api/messaging/conversations
   */
  @Get('conversations')
  async getConversations(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetConversationsQueryDto,
  ) {
    return this.messagingService.getConversations(req.user.userId, query);
  }

  /**
   * Create a new conversation
   * POST /api/messaging/conversations
   * Body: { participantIds: [1, 2, 3], initialMessage?: "Hello!" }
   */
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messagingService.createConversation(dto, req.user.userId);
  }

  /**
   * Get messages in a specific conversation
   * GET /api/messaging/conversations/:id/messages
   */
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Request() req: AuthenticatedRequest,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagingService.getConversationMessages(
      conversationId,
      req.user.userId,
      query,
    );
  }

  /**
   * Send a message (to existing conversation or create new one)
   * POST /api/messaging/messages
   * Body: { content: "Hello", conversationId?: 1, recipientId?: 2 }
   */
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Body() dto: CreateMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.messagingService.sendMessage(dto, req.user.userId);
  }

  /**
   * Get available property managers (for tenants to initiate conversations)
   * GET /api/messaging/property-managers
   */
  @Get('property-managers')
  async getPropertyManagers() {
    return this.messagingService.findPropertyManagers();
  }

  /**
   * Get all tenants (for property managers to initiate conversations)
   * GET /api/messaging/tenants
   */
  @Get('tenants')
  @UseGuards(RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  async getTenants() {
    return this.messagingService.findAllTenants();
  }

  /**
   * Get all users (admin only - for managing conversations)
   * GET /api/messaging/users
   */
  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  async getAllUsers() {
    return this.messagingService.findAllUsers();
  }

  /**
   * Get all conversations (property manager view - can see all)
   * GET /api/messaging/admin/conversations
   */
  @Get('admin/conversations')
  @UseGuards(RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  async getAllConversations(@Query() query: GetConversationsQueryDto) {
    return this.messagingService.getAllConversations(query);
  }

  /**
   * Search conversations by username
   * GET /api/messaging/search?q=username
   */
  @Get('search')
  async searchConversations(
    @Query('q') searchTerm: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // Property managers can search all, tenants only their own
    const userId = req.user.role === 'PROPERTY_MANAGER' ? undefined : req.user.userId;
    return this.messagingService.searchConversations(searchTerm, userId);
  }

  /**
   * Get conversation statistics (property manager only)
   * GET /api/messaging/stats
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  async getStats() {
    return this.messagingService.getConversationStats();
  }
}
