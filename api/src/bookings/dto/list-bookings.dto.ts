import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingStatus } from '../entities/booking.entity';

/**
 * DTO for query params of GET /bookings
 * Inherits PaginationDto to have page & limit built-in.
 */
export class ListBookingsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by Location ID (UUID)',
    example: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
