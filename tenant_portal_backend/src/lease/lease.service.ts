
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LeaseService {
  constructor(private prisma: PrismaService) {}

  async createLease(data: { startDate: Date; endDate: Date; rentAmount: number; tenantId: number; unitId: number }) {
    return this.prisma.lease.create({ data });
  }

  async getAllLeases() {
    return this.prisma.lease.findMany({ include: { tenant: true, unit: true } });
  }

  async getLeaseById(id: number) {
    return this.prisma.lease.findUnique({ where: { id }, include: { tenant: true, unit: true } });
  }

  async getLeaseByTenantId(tenantId: number) {
    return this.prisma.lease.findUnique({ where: { tenantId }, include: { unit: { include: { property: true } } } });
  }

  async updateLease(id: number, data: { startDate?: Date; endDate?: Date; rentAmount?: number }) {
    return this.prisma.lease.update({ where: { id }, data });
  }
}
