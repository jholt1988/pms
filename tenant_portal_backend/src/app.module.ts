
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PrismaModule } from './prisma/prisma.module';
import { MessagingModule } from './messaging/messaging.module';
import { LeaseModule } from './lease/lease.module';
import { RentalApplicationModule } from './rental-application/rental-application.module';
import { PropertyModule } from './property/property.module';
import { ExpenseModule } from './expense/expense.module';
import { RentEstimatorModule } from './rent-estimator/rent-estimator.module';
import { PaymentsModule } from './payments/payments.module';
import { BillingModule } from './billing/billing.module';
import { SecurityEventsModule } from './security-events/security-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MaintenanceModule,
    PaymentsModule,
    MessagingModule,
    LeaseModule,
    RentalApplicationModule,
    PropertyModule,
    ExpenseModule,
    RentEstimatorModule,
    BillingModule,
    SecurityEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
