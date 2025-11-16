import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { BulkMessagingService } from './bulk-messaging.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessagingController],
  providers: [MessagingService, BulkMessagingService],
  exports: [MessagingService, BulkMessagingService],
})
export class MessagingModule {}
