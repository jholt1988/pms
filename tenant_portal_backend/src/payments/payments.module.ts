
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';

@Module({
  controllers: [PaymentsController, PaymentMethodsController],
  providers: [PaymentsService, PaymentMethodsService],
  exports: [PaymentsService, PaymentMethodsService],
})
export class PaymentsModule {}

