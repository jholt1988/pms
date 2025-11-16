import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyAvailabilityStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  address: string;
}

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

export class PropertyPhotoDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class PropertyAmenityDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class UpdatePropertyMarketingDto {
  @IsOptional()
  @IsNumber()
  minRent?: number;

  @IsOptional()
  @IsNumber()
  maxRent?: number;

  @IsOptional()
  @IsEnum(PropertyAvailabilityStatus)
  availabilityStatus?: PropertyAvailabilityStatus;

  @IsOptional()
  @IsString()
  availableOn?: string;

  @IsOptional()
  @IsString()
  marketingHeadline?: string;

  @IsOptional()
  @IsString()
  marketingDescription?: string;

  @IsOptional()
  @IsBoolean()
  isSyndicationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyPhotoDto)
  photos?: PropertyPhotoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyAmenityDto)
  amenities?: PropertyAmenityDto[];
}
