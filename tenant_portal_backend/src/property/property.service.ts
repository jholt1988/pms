import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePropertyDto,
  UpdatePropertyMarketingDto,
  PropertyAmenityDto,
  PropertyPhotoDto,
} from './dto/property.dto';

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
        marketingProfile: true,
        photos: {
          orderBy: { displayOrder: 'asc' },
        },
        amenities: {
          include: { amenity: true },
        },
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

  async getMarketingProfile(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        marketingProfile: true,
        photos: { orderBy: { displayOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        units: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    return {
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
      },
      marketingProfile: property.marketingProfile,
      photos: property.photos,
      amenities: property.amenities.map((amenity) => ({
        id: amenity.amenityId,
        key: amenity.amenity.key,
        label: amenity.amenity.label,
        description: amenity.amenity.description,
        category: amenity.amenity.category,
        isFeatured: amenity.isFeatured,
        value: amenity.value,
      })),
      unitCount: property.units.length,
    };
  }

  async updateMarketingProfile(propertyId: number, dto: UpdatePropertyMarketingDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    const { photos, amenities, availableOn, ...profileFields } = dto;

    await this.prisma.propertyMarketingProfile.upsert({
      where: { propertyId },
      create: {
        propertyId,
        ...profileFields,
        availableOn: availableOn ? new Date(availableOn) : undefined,
      },
      update: {
        ...profileFields,
        availableOn: availableOn ? new Date(availableOn) : undefined,
      },
    });

    if (photos) {
      await this.replacePhotos(propertyId, photos);
    }

    if (amenities) {
      await this.replaceAmenities(propertyId, amenities);
    }

    return this.getMarketingProfile(propertyId);
  }

  private async replacePhotos(propertyId: number, photos: PropertyPhotoDto[]) {
    await this.prisma.propertyPhoto.deleteMany({ where: { propertyId } });

    if (!photos.length) {
      return;
    }

    await this.prisma.propertyPhoto.createMany({
      data: photos.map((photo, index) => ({
        propertyId,
        url: photo.url,
        caption: photo.caption,
        isPrimary: photo.isPrimary ?? index === 0,
        displayOrder: photo.displayOrder ?? index,
      })),
    });
  }

  private async replaceAmenities(propertyId: number, amenities: PropertyAmenityDto[]) {
    await this.prisma.propertyAmenity.deleteMany({ where: { propertyId } });

    if (!amenities.length) {
      return;
    }

    const normalized = [] as { amenityId: number; isFeatured: boolean; value?: string }[];
    for (const amenity of amenities) {
      const amenityRecord = await this.prisma.amenity.upsert({
        where: { key: amenity.key },
        create: {
          key: amenity.key,
          label: amenity.label,
          description: amenity.description,
          category: amenity.category,
        },
        update: {
          label: amenity.label,
          description: amenity.description,
          category: amenity.category,
        },
      });
      normalized.push({
        amenityId: amenityRecord.id,
        isFeatured: amenity.isFeatured ?? false,
        value: amenity.value,
      });
    }

    await this.prisma.propertyAmenity.createMany({
      data: normalized.map((record) => ({
        propertyId,
        amenityId: record.amenityId,
        isFeatured: record.isFeatured,
        value: record.value,
      })),
    });
  }
}
