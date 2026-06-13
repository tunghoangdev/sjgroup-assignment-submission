import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import {
  checkOpenTime,
  checkOpenTimeWithSchedule,
} from '../common/helpers/open-time.helper';
import {
  type Location,
  LocationType,
} from '../locations/entities/location.entity';
import { LocationsService } from '../locations/locations.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { ListBookingsDto } from './dto/list-bookings.dto';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @Inject(LocationsService)
    private readonly locationsService: LocationsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto): Promise<Booking> {
    const start = new Date(createBookingDto.startTime);
    const end = new Date(createBookingDto.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date format.');
    }

    if (start >= end) {
      throw new BadRequestException(
        'Booking start time must be before end time.',
      );
    }

    // Run within a transaction to ensure integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the location
      let location: Location;
      try {
        location = await this.locationsService.getLocationById(
          createBookingDto.locationId,
        );
      } catch {
        throw new NotFoundException(
          `Location with ID '${createBookingDto.locationId}' not found.`,
        );
      }

      // Check location type - bookings only allowed for ROOMs
      if (location.type !== LocationType.ROOM) {
        const reason = `Booking rejected: location is not a room (type: ${location.type})`;
        await this.saveRejectedBooking(
          queryRunner.manager,
          createBookingDto,
          start,
          end,
          reason,
        );
        await queryRunner.commitTransaction();
        throw new BadRequestException(reason);
      }

      // 1. DEPARTMENT CHECK
      // Get department code from location
      const roomDepartmentCode = location.department
        ? location.department.code
        : null;

      // If room has exclusive department (e.g., 'EFM', 'ASS'...)
      if (roomDepartmentCode) {
        // Compare directly with the string that the User entered in the Booked By field
        const userInputDepartment = createBookingDto.bookedBy?.trim();

        if (roomDepartmentCode !== userInputDepartment) {
          const reason = `Booking rejected: department mismatch (This room is exclusive for ${roomDepartmentCode}, but requested by ${userInputDepartment || 'N/A'})`;

          // Save rejected booking record
          await this.saveRejectedBooking(
            queryRunner.manager,
            createBookingDto,
            start,
            end,
            reason,
          );

          await queryRunner.commitTransaction();
          throw new BadRequestException(reason);
        }
      }

      // 2. CAPACITY CHECK
      if (
        location.capacity !== null &&
        createBookingDto.attendees > location.capacity
      ) {
        const reason = `Booking rejected: capacity exceeded (room capacity: ${location.capacity}, requested: ${createBookingDto.attendees})`;
        await this.saveRejectedBooking(
          queryRunner.manager,
          createBookingDto,
          start,
          end,
          reason,
        );
        await queryRunner.commitTransaction();
        throw new BadRequestException(reason);
      }

      // 3. TIME VALIDATION
      const timeCheck = location.openSchedule
        ? checkOpenTimeWithSchedule(location.openSchedule, start, end)
        : checkOpenTime(location.openTime, start, end);
      this.logger.debug(
        `Time check for location ${location.id}: valid=${timeCheck.isValid}` +
          (timeCheck.reason ? `, reason=${timeCheck.reason}` : ''),
      );
      if (!timeCheck.isValid) {
        const reason = `Booking rejected: ${timeCheck.reason}`;
        await this.saveRejectedBooking(
          queryRunner.manager,
          createBookingDto,
          start,
          end,
          reason,
        );
        await queryRunner.commitTransaction();
        throw new BadRequestException(reason);
      }

      // 4. OVERLAP CHECK (Double Booking)
      // Ensure 2 requests arriving at the same time will be serialized, not double-book (use SELECT ... FOR UPDATE to lock the rows)
      const overlap = await queryRunner.manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.location_id = :locationId', {
          locationId: createBookingDto.locationId,
        })
        .andWhere('booking.status = :status', {
          status: BookingStatus.CONFIRMED,
        })
        .andWhere(
          '((booking.start_time < :end AND booking.end_time > :start))',
          { start, end },
        )
        .setLock('pessimistic_write')
        .getOne();

      if (overlap) {
        const reason = `Booking rejected: The room is already booked for this time slot (overlapping with booking ID: ${overlap.id})`;
        await this.saveRejectedBooking(
          queryRunner.manager,
          createBookingDto,
          start,
          end,
          reason,
        );
        await queryRunner.commitTransaction();
        throw new BadRequestException(reason);
      }

      // If all checks pass, save as confirmed
      const booking = queryRunner.manager.create(Booking, {
        locationId: createBookingDto.locationId,
        bookedBy: createBookingDto.bookedBy,
        attendees: createBookingDto.attendees,
        startTime: start,
        endTime: end,
        status: BookingStatus.CONFIRMED,
        rejectReason: null,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();
      return savedBooking;
    } catch (err) {
      // If it's a Nest HttpException, rethrow it
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      // Otherwise roll back and throw internal error
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private saveRejectedBooking(
    manager: EntityManager,
    dto: CreateBookingDto,
    start: Date,
    end: Date,
    reason: string,
  ): Promise<Booking> {
    const booking = manager.create(Booking, {
      locationId: dto.locationId,
      bookedBy: dto.bookedBy,
      attendees: dto.attendees,
      startTime: start,
      endTime: end,
      status: BookingStatus.REJECTED,
      rejectReason: reason,
    });
    return manager.save(Booking, booking);
  }

  async listBookings(dto: ListBookingsDto): Promise<{
    data: Booking[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { locationId, status, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.location', 'location');

    if (locationId) {
      query.andWhere('booking.location_id = :locationId', { locationId });
    }

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    const [data, total] = await query
      .orderBy('booking.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['location'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID '${id}' not found.`);
    }
    return booking;
  }

  async cancelBooking(id: string): Promise<Booking> {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled.');
    }
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
