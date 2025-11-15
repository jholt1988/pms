import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @IsOptional()
  conversationId?: number;

  @IsInt()
  @IsOptional()
  recipientId?: number;
}

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  participantIds: number[];

  @IsString()
  @IsOptional()
  initialMessage?: string;
}

export class GetConversationsQueryDto {
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @IsOptional()
  limit?: number = 20;
}

export class GetMessagesQueryDto {
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @IsOptional()
  limit?: number = 50;
}
