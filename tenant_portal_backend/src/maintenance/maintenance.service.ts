import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MaintenanceRequest, Prisma, Status } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, title: string, description: string): Promise<MaintenanceRequest> {
    const data: Prisma.MaintenanceRequestCreateInput = {
      title,
      description,
      author: { connect: { id: userId } },
    };
    return this.prisma.maintenanceRequest.create({ data });
  }

  async findAllForUser(userId: number): Promise<MaintenanceRequest[]> {
    return this.prisma.maintenanceRequest.findMany({
      where: { authorId: userId },
    });
  }

  async updateStatus(id: number, status: Status): Promise<MaintenanceRequest> {
    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
    });
  }
}