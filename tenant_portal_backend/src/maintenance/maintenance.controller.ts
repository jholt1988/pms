import { Controller, Get, Post, Body, UseGuards, Request, Param, Patch, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaintenanceService } from './maintenance.service';
import { Role, Status } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { AddMaintenanceNoteDto } from './dto/add-maintenance-note.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: Role;
  };
}

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    if (req.user.role === Role.PROPERTY_MANAGER) {
      return this.maintenanceService.findAll();
    }
    return this.maintenanceService.findAllForUser(req.user.userId);
  }

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.create(req.user.userId, dto);
  }

  @Patch(':id/status')
  @Roles(Role.PROPERTY_MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateMaintenanceStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.updateStatus(Number(id), updateStatusDto, req.user.userId);
  }

  @Patch(':id/assign')
  @Roles(Role.PROPERTY_MANAGER)
  async assignTechnician(
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.assignTechnician(Number(id), dto, req.user.userId);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddMaintenanceNoteDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.addNote(Number(id), dto, req.user.userId);
  }

  @Get('technicians')
  @Roles(Role.PROPERTY_MANAGER)
  listTechnicians() {
    return this.maintenanceService.listTechnicians();
  }

  @Post('technicians')
  @Roles(Role.PROPERTY_MANAGER)
  createTechnician(@Body() body: { name: string; phone?: string; email?: string; userId?: number; role?: string }) {
    return this.maintenanceService.createTechnician(body);
  }

  @Get('assets')
  @Roles(Role.PROPERTY_MANAGER)
  listAssets(@Query('propertyId') propertyId?: string, @Query('unitId') unitId?: string) {
    return this.maintenanceService.listAssets(propertyId ? Number(propertyId) : undefined, unitId ? Number(unitId) : undefined);
  }

  @Post('assets')
  @Roles(Role.PROPERTY_MANAGER)
  createAsset(
    @Body()
    body: {
      propertyId: number;
      unitId?: number;
      name: string;
      category: string;
      manufacturer?: string;
      model?: string;
      serialNumber?: string;
      installDate?: Date;
    },
  ) {
    return this.maintenanceService.createAsset(body);
  }

  @Get('sla-policies')
  @Roles(Role.PROPERTY_MANAGER)
  getSlaPolicies(@Query('propertyId') propertyId?: string) {
    return this.maintenanceService.getSlaPolicies(propertyId ? Number(propertyId) : undefined);
  }
}
