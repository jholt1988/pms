
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Invoice, Payment, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({ data });
  }

  async getInvoices(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InvoiceWhereUniqueInput;
    where?: Prisma.InvoiceWhereInput;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
  }): Promise<Invoice[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.invoice.findMany({ skip, take, cursor, where, orderBy });
  }

  async createPayment(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async getPayments(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PaymentWhereUniqueInput;
    where?: Prisma.PaymentWhereInput;
    orderBy?: Prisma.PaymentOrderByWithRelationInput;
  }): Promise<Payment[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.payment.findMany({ skip, take, cursor, where, orderBy });
  }
}
