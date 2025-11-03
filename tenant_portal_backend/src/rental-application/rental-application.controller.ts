
import { Controller, Get, Post, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RentalApplicationService } from './rental-application.service';
import { Roles } from '../auth/roles.decorator';
import { Role, ApplicationStatus } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('rental-applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RentalApplicationController {
  constructor(private readonly rentalApplicationService: RentalApplicationService) {}

  @Post()
  @Roles(Role.TENANT)
  submitApplication(
    @Request() req: AuthenticatedRequest,
    @Body() data: { propertyId: number; unitId: number; fullName: string; email: string; phoneNumber: string; income: number; employmentStatus: string; previousAddress: string },
  ) {
    return this.rentalApplicationService.submitApplication(req.user.userId, data);
  }

  @Get()
  @Roles(Role.PROPERTY_MANAGER)
  getAllApplications() {
    return this.rentalApplicationService.getAllApplications();
  }

  @Get('my-applications')
  @Roles(Role.TENANT)
  getMyApplications(@Request() req: AuthenticatedRequest) {
    return this.rentalApplicationService.getApplicationsByApplicantId(req.user.userId);
  }

  @Get(':id')
  getApplicationById(@Param('id') id: string) {
    return this.rentalApplicationService.getApplicationById(Number(id));
  }

  @Put(':id/status')
  @Roles(Role.PROPERTY_MANAGER)
  updateApplicationStatus(@Param('id') id: string, @Body() data: { status: ApplicationStatus }) {
    return this.rentalApplicationService.updateApplicationStatus(Number(id), data.status);
  }

  @Post(':id/screen')
  @Roles(Role.PROPERTY_MANAGER)
  screenApplication(@Param('id') id: string) {
    return this.rentalApplicationService.screenApplication(Number(id));
  }
}
