import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaintenanceAsset,
  MaintenanceAssetCategory,
  MaintenanceNote,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceRequestHistory,
  MaintenanceSlaPolicy,
  Status,
  Technician, TechnicianRole,
} from '@prisma/client';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { AddMaintenanceNoteDto } from './dto/add-maintenance-note.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateMaintenanceRequestDto): Promise<MaintenanceRequest> {
    const priority = dto.priority ?? MaintenancePriority.MEDIUM;
    const dueAt = await this.computeDueDate(dto.propertyId ?? null, priority);

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority,
        dueAt,
        author: { connect: { id: userId } },
        property: dto.propertyId ? { connect: { id: dto.propertyId } } : undefined,
        unit: dto.unitId ? { connect: { id: dto.unitId } } : undefined,
        asset: dto.assetId ? { connect: { id: dto.assetId } } : undefined,
      },
      include: this.defaultRequestInclude,
    });

    await this.recordHistory(request.id, {
      toStatus: request.status,
      note: 'Request created',
      changedById: userId,
    });

    return request;
  }

  async findAllForUser(userId: number): Promise<MaintenanceRequest[]> {
    return this.prisma.maintenanceRequest.findMany({
      where: { authorId: userId },
      include: this.defaultRequestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(): Promise<MaintenanceRequest[]> {
    return this.prisma.maintenanceRequest.findMany({
      include: this.defaultRequestInclude,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueAt: 'asc' },
      ],
    });
  }

  async updateStatus(
    id: number,
    dto: UpdateMaintenanceStatusDto,
    actorId: number,
  ): Promise<MaintenanceRequest> {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: this.defaultRequestInclude,
    });
    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }

    const updateData: any = { status: dto.status };
    if (!existing.acknowledgedAt && dto.status === Status.IN_PROGRESS) {
      updateData.acknowledgedAt = new Date();
    }
    if (dto.status === Status.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: this.defaultRequestInclude,
    });

    await this.recordHistory(id, {
      fromStatus: existing.status,
      toStatus: dto.status,
      changedById: actorId,
      note: dto.note,
      toAssignee: updated.assigneeId ?? undefined,
      fromAssignee: existing.assigneeId ?? undefined,
    });

    if (dto.note) {
      await this.addNote(id, { body: dto.note }, actorId);
    }

    return updated;
  }

  async assignTechnician(
    id: number,
    dto: AssignTechnicianDto,
    actorId: number,
  ): Promise<MaintenanceRequest> {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        assignee: { connect: { id: dto.technicianId } },
      },
      include: this.defaultRequestInclude,
    });

    await this.recordHistory(id, {
      changedById: actorId,
      fromAssignee: existing.assigneeId ?? undefined,
      toAssignee: dto.technicianId,
      toStatus: updated.status,
      note: 'Technician assigned',
    });

    return updated;
  }

  async addNote(
    requestId: number,
    dto: AddMaintenanceNoteDto,
    authorId: number,
  ): Promise<MaintenanceNote> {
    const note = await this.prisma.maintenanceNote.create({
      data: {
        request: { connect: { id: requestId } },
        author: { connect: { id: authorId } },
        body: dto.body,
      },
      include: { author: true },
    });

    return note;
  }

  async listTechnicians(): Promise<Technician[]> {
    return this.prisma.technician.findMany({ orderBy: { name: 'asc' } });
  }

  async createTechnician(data: { name: string; phone?: string; email?: string; userId?: number; role?: string }): Promise<Technician> {
    return this.prisma.technician.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        user: data.userId ? { connect: { id: data.userId } } : undefined,
        role: (data.role as TechnicianRole | undefined) ?? TechnicianRole.IN_HOUSE,
      },
    });
  }

  async listAssets(propertyId?: number, unitId?: number): Promise<MaintenanceAsset[]> {
    return this.prisma.maintenanceAsset.findMany({
      where: {
        propertyId,
        unitId,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createAsset(data: {
    propertyId: number;
    unitId?: number;
    name: string;
    category: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    installDate?: Date;
  }): Promise<MaintenanceAsset> {
    return this.prisma.maintenanceAsset.create({
      data: {
        property: { connect: { id: data.propertyId } },
        unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
        name: data.name,
        category: data.category as MaintenanceAssetCategory,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        installDate: data.installDate,
      },
    });
  }

  async getSlaPolicies(propertyId?: number): Promise<MaintenanceSlaPolicy[]> {
    return this.prisma.maintenanceSlaPolicy.findMany({
      where: {
        OR: [{ propertyId: null }, { propertyId }],
      },
      orderBy: [{ propertyId: 'desc' }, { priority: 'asc' }],
    });
  }

  private async computeDueDate(
    propertyId: number | null,
    priority: MaintenancePriority,
  ): Promise<Date | null> {
    const policies = await this.getSlaPolicies(propertyId ?? undefined);
    const policy = policies.find((p) => p.priority === priority);
    if (!policy) {
      return null;
    }
    const now = new Date();
    return new Date(now.getTime() + policy.resolutionTimeMinutes * 60 * 1000);
  }

  private get defaultRequestInclude() {
    return {
      author: true,
      property: true,
      unit: true,
      asset: true,
      assignee: true,
      notes: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
      history: {
        orderBy: { createdAt: 'desc' },
      },
    } satisfies Parameters<typeof this.prisma.maintenanceRequest.findMany>[0]['include'];
  }

  private async recordHistory(
    requestId: number,
    data: {
      changedById?: number;
      fromStatus?: Status;
      toStatus?: Status;
      fromAssignee?: number;
      toAssignee?: number;
      note?: string;
    },
  ): Promise<MaintenanceRequestHistory> {
    return this.prisma.maintenanceRequestHistory.create({
      data: {
        request: { connect: { id: requestId } },
        changedBy: data.changedById ? { connect: { id: data.changedById } } : undefined,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        fromAssignee: data.fromAssignee ?? null,
        toAssignee: data.toAssignee ?? null,
        note: data.note,
      },
    });
  }
}



