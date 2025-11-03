
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async createProperty(data: { name: string; address: string }) {
    return this.prisma.property.create({ data });
  }

  async createUnit(propertyId: number, name: string) {
    return this.prisma.unit.create({ data: { propertyId, name } });
  }

  async getAllProperties() {
    return this.prisma.property.findMany({ include: { units: true } });
  }

  async getPropertyById(id: number) {
    return this.prisma.property.findUnique({ where: { id }, include: { units: true } });
  }
}
