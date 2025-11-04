
import { Controller, Get, Post, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaseService } from './lease.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('leases')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Post()
  @Roles(Role.PROPERTY_MANAGER)
  createLease(@Body() data: { startDate: Date; endDate: Date; rentAmount: number; tenantId: number; unitId: number }) {
    return this.leaseService.createLease(data);
  }

  @Get()
  @Roles(Role.PROPERTY_MANAGER)
  getAllLeases() {
    return this.leaseService.getAllLeases();
  }

  @Get('my-lease')
  @Roles(Role.TENANT)
  getMyLease(@Request() req: AuthenticatedRequest) {
    return this.leaseService.getLeaseByTenantId(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.PROPERTY_MANAGER)
  getLeaseById(@Param('id') id: string) {
    return this.leaseService.getLeaseById(Number(id));
  }

  @Put(':id')
  @Roles(Role.PROPERTY_MANAGER)
  updateLease(@Param('id') id: string, @Body() data: { startDate?: Date; endDate?: Date; rentAmount?: number }) {
    return this.leaseService.updateLease(Number(id), data);
  }
}
