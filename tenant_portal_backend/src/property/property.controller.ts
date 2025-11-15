import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyService } from './property.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePropertyDto, CreateUnitDto } from './dto/property.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    role: Role;
  };
}

@Controller('api/properties')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.propertyService.createProperty(dto);
  }

  @Post(':id/units')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PROPERTY_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  createUnit(
    @Param('id', ParseIntPipe) propertyId: number,
    @Body() dto: CreateUnitDto,
  ) {
    return this.propertyService.createUnit(propertyId, dto.name);
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
  getPropertyById(@Param('id', ParseIntPipe) id: number) {
    return this.propertyService.getPropertyById(id);
  }
}
