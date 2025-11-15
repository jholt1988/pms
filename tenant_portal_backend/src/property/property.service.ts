import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertyService {
  constructor(private prisma: PrismaService) {}

  async createProperty(dto: CreatePropertyDto) {
    try {
      return await this.prisma.property.create({
        data: {
          name: dto.name,
          address: dto.address,
        },
        include: {
          units: true,
        },
      });
    } catch (error) {
      console.error('Error creating property:', error);
      throw new BadRequestException('Failed to create property. Please check your input.');
    }
  }

  async createUnit(propertyId: number, name: string) {
    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    try {
      return await this.prisma.unit.create({
        data: {
          propertyId,
          name,
        },
        include: {
          property: true,
        },
      });
    } catch (error) {
      console.error('Error creating unit:', error);
      throw new BadRequestException('Failed to create unit. Please check your input.');
    }
  }

  async getAllProperties() {
    return this.prisma.property.findMany({
      include: {
        units: true,
      },
    });
  }

  async getPropertyById(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        units: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }
}
