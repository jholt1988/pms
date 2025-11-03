
import { Module } from '@nestjs/common';
import { LeaseController } from './lease.controller';
import { LeaseService } from './lease.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LeaseController],
  providers: [LeaseService, PrismaService],
})
export class LeaseModule {}
