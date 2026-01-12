import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType, UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserType, example: UserType.RESTAURANT })
  @IsEnum(UserType)
  type: UserType;

  @ApiProperty({ enum: UserRole, example: UserRole.OWNER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Restaurant ID to associate user with' })
  @IsUUID()
  @IsOptional()
  restaurantId?: string;
}
