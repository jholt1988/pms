import { IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
