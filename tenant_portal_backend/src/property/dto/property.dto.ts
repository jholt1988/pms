import { IsString, IsNotEmpty, MinLength } from 'class-validator';

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
