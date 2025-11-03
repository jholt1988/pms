
import { Module } from '@nestjs/common';
import { RentalApplicationController } from './rental-application.controller';
import { RentalApplicationService } from './rental-application.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RentalApplicationController],
  providers: [RentalApplicationService, PrismaService],
})
export class RentalApplicationModule {}
