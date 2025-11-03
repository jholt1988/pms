
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PrismaService } from './prisma.service';
import { MessagingModule } from './messaging/messaging.module';
import { LeaseModule } from './lease/lease.module';
import { RentalApplicationModule } from './rental-application/rental-application.module';
import { PropertyModule } from './property/property.module';
import { ExpenseModule } from './expense/expense.module';
import { RentEstimatorModule } from './rent-estimator/rent-estimator.module';

import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [AuthModule, MaintenanceModule, PaymentsModule, MessagingModule, LeaseModule, RentalApplicationModule, PropertyModule, ExpenseModule, RentEstimatorModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
