import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (performs validation)' })
  @ApiResponse({ status: 201, description: 'Booking confirmed successfully.' })
  @ApiResponse({
    status: 400,
    description:
      'Booking rejected (validation mismatch / overlap / bad request).',
  })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createBooking(createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of bookings.' })
  findAll(@Query() listBookingsDto: ListBookingsDto) {
    return this.bookingsService.listBookings(listBookingsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific booking by ID' })
  @ApiResponse({ status: 200, description: 'Return booking details.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Booking already cancelled or bad request.',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.cancelBooking(id);
  }
}
