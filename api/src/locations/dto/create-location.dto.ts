import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '../entities/location.entity';

export class EntityReferenceDto {
  @ApiProperty({ description: 'UUID of the referenced entity' })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class CreateLocationDto {
  @ApiPropertyOptional({
    description: 'Reference to the parent location node',
    type: () => EntityReferenceDto,
  })
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  @IsOptional()
  parent?: EntityReferenceDto;

  @ApiProperty({
    description: 'Name of the location (e.g., building, floor, meeting room)',
    example: 'Phòng họp Lotus',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Unique location code/number',
    example: 'B1-F2-R5',
  })
  @IsString()
  @IsNotEmpty()
  locationNumber: string;

  @ApiProperty({
    description: 'Building identifier',
    example: 'Tòa nhà A',
  })
  @IsString()
  @IsNotEmpty()
  building: string;

  @ApiPropertyOptional({
    description: 'Reference to the managing department (required for ROOM)',
    type: () => EntityReferenceDto,
  })
  @ValidateNested()
  @Type(() => EntityReferenceDto)
  @IsOptional()
  department?: EntityReferenceDto;

  @ApiPropertyOptional({
    description: 'Maximum capacity (only applicable to ROOM type)',
    minimum: 1,
    example: 15,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description:
      'Operational hours. Supported formats: "Mon to Fri (9AM to 6PM)", "Mon to Sat (9AM to 6PM)", "Mon to Sun (9AM to 6PM)" or "Always open".',
    example: 'Mon to Fri (9AM to 6PM)',
  })
  @IsString()
  @IsOptional()
  openTime?: string;

  @ApiProperty({
    description: 'Type of the location',
    enum: ['building', 'floor', 'room'],
    example: 'room',
  })
  @IsEnum(LocationType)
  @IsNotEmpty()
  type: LocationType;
}
