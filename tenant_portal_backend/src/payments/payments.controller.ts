
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { Invoice, Payment, Prisma } from '@prisma/client';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('invoices')
  async createInvoice(@Body() data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.paymentsService.createInvoice(data);
  }

  @Get('invoices')
  async getInvoices(@Query() params: any): Promise<Invoice[]> {
    return this.paymentsService.getInvoices(params);
  }

  @Post()
  async createPayment(@Body() data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.paymentsService.createPayment(data);
  }

  @Get()
  async getPayments(@Query() params: any): Promise<Payment[]> {
    return this.paymentsService.getPayments(params);
  }
}
