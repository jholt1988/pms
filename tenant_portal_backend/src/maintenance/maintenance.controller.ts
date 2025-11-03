
import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaintenanceService } from './maintenance.service';
import { Status } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

interface CreateRequestDto {
  title: string;
  description: string;
}

interface UpdateStatusDto {
  status: Status;
}

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'))
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.maintenanceService.findAllForUser(req.user.userId);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() createRequestDto: CreateRequestDto) {
    return this.maintenanceService.create(
      req.user.userId,
      createRequestDto.title,
      createRequestDto.description,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.maintenanceService.updateStatus(Number(id), updateStatusDto.status);
  }
}
