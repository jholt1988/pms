
import { Module } from '@nestjs/common';
import { RentEstimatorController } from './rent-estimator.controller';
import { RentEstimatorService } from './rent-estimator.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RentEstimatorController],
  providers: [RentEstimatorService, PrismaService],
})
export class RentEstimatorModule {}
