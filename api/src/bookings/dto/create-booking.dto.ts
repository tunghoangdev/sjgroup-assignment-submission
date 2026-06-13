import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the room to be booked (UUID)',
    example: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({
    description: 'Name of the person booking',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  bookedBy: string;

  @ApiProperty({
    description: 'Number of attendees',
    minimum: 1,
    example: 10,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  attendees: number;

  @ApiProperty({
    description: 'Start time (ISO 8601 format)',
    example: '2026-06-12T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time (ISO 8601 format)',
    example: '2026-06-12T11:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}
