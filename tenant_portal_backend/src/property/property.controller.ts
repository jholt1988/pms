
import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyService } from './property.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  createProperty(@Body() data: { name: string; address: string }) {
    return this.propertyService.createProperty(data);
  }

  @Post(':id/units')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  createUnit(@Param('id') propertyId: string, @Body() data: { name: string }) {
    return this.propertyService.createUnit(Number(propertyId), data.name);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  getAllProperties() {
    return this.propertyService.getAllProperties();
  }

  @Get('public')
  getPublicProperties() {
    return this.propertyService.getAllProperties();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  getPropertyById(@Param('id') id: string) {
    return this.propertyService.getPropertyById(Number(id));
  }
}
