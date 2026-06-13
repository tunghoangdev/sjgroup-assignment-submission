import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { LocationsService } from '../locations/locations.service';
import { LocationType } from '../locations/entities/location.entity';

// Inline type to avoid bun bundler re-export issue with 'type' imports
type MockLocation = {
  id: string;
  name: string;
  type: LocationType;
  locationNumber: string;
  building: string;
  capacity: number | null;
  openTime: string | null;
  openSchedule: { days: number[]; start: number; end: number } | null;
  department: { id: string; name: string; code: string } | null;
  departmentId: string | null;
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockRoom: MockLocation = {
  id: 'room-uuid-001',
  name: 'Conference Room A',
  type: LocationType.ROOM,
  locationNumber: 'A-01-01',
  building: 'A',
  capacity: 10,
  openTime: 'Mon to Fri (9AM to 6PM)',
  // openSchedule is computed on insert — provide pre-parsed value for unit tests
  openSchedule: {
    days: [1, 2, 3, 4, 5],
    start: 540,
    end: 1080,
  },
  department: { id: 'dept-001', name: 'EFM', code: 'EFM' },
  departmentId: 'dept-001',
};

// Wednesday 2026-06-10 10:00–11:00 Vietnam time (UTC+7 → UTC 03:00–04:00)
const validStart = new Date('2026-06-10T03:00:00.000Z');
const validEnd = new Date('2026-06-10T04:00:00.000Z');

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBookingRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockLocationsService = {
  getLocationById: jest.fn(),
};

// QueryRunner mock that mimics the pessimistic-write flow
const mockQueryRunner = {
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        { provide: LocationsService, useValue: mockLocationsService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    // Default: location is a valid room with EFM department
    mockLocationsService.getLocationById.mockResolvedValue(mockRoom);

    // Default overlap query: no overlap found
    const mockQB = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQB);

    // Default save: return a booking object
    const savedBooking = { id: 'booking-001', status: BookingStatus.CONFIRMED };
    mockQueryRunner.manager.create.mockReturnValue(savedBooking);
    mockQueryRunner.manager.save.mockResolvedValue(savedBooking);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('should create a booking successfully', async () => {
    const result = await service.createBooking({
      locationId: 'room-uuid-001',
      bookedBy: 'EFM',
      attendees: 5,
      startTime: validStart.toISOString(),
      endTime: validEnd.toISOString(),
    });

    expect(result.status).toBe(BookingStatus.CONFIRMED);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  // ── Reject: invalid date format ─────────────────────────────────────────────

  it('should throw BadRequestException for invalid date format', async () => {
    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: 'not-a-date',
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when start >= end', async () => {
    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: validEnd.toISOString(),
        endTime: validStart.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Reject: location not found ──────────────────────────────────────────────

  it('should throw NotFoundException when location does not exist', async () => {
    mockLocationsService.getLocationById.mockRejectedValueOnce(
      new NotFoundException(),
    );

    await expect(
      service.createBooking({
        locationId: 'non-existing-id',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // ── Reject: location type not room ──────────────────────────────────────────

  it('should reject booking when location is not a room', async () => {
    mockLocationsService.getLocationById.mockResolvedValueOnce({
      ...mockRoom,
      type: LocationType.FLOOR,
    });

    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Reject: department mismatch ─────────────────────────────────────────────

  it('should reject booking when department does not match', async () => {
    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'FSS', // room is EFM-exclusive
        attendees: 5,
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);

    // Should also save a REJECTED audit record
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  // ── Reject: capacity exceeded ───────────────────────────────────────────────

  it('should reject booking when attendees exceed room capacity', async () => {
    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 99, // room capacity is 10
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Reject: outside operational hours ──────────────────────────────────────

  it('should reject booking outside operational hours (8PM Vietnam time)', async () => {
    // 8PM Vietnam = 13:00 UTC
    const outsideStart = new Date('2026-06-10T13:00:00.000Z');
    const outsideEnd = new Date('2026-06-10T14:00:00.000Z');

    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: outsideStart.toISOString(),
        endTime: outsideEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject booking on a Saturday (outside operational days)', async () => {
    // Saturday 2026-06-13 10:00 Vietnam = 03:00 UTC
    const satStart = new Date('2026-06-13T03:00:00.000Z');
    const satEnd = new Date('2026-06-13T04:00:00.000Z');

    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: satStart.toISOString(),
        endTime: satEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Reject: overlapping booking ─────────────────────────────────────────────

  it('should reject booking when a time slot overlap exists', async () => {
    const existingBooking = {
      id: 'existing-booking-001',
      status: BookingStatus.CONFIRMED,
    };

    // Simulate overlap found by query builder
    const mockQB = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(existingBooking),
    };
    mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQB);
    mockQueryRunner.manager.save.mockResolvedValue({
      status: BookingStatus.REJECTED,
    });

    await expect(
      service.createBooking({
        locationId: 'room-uuid-001',
        bookedBy: 'EFM',
        attendees: 5,
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── cancelBooking ───────────────────────────────────────────────────────────

  describe('cancelBooking', () => {
    it('should cancel a confirmed booking', async () => {
      const confirmedBooking = {
        id: 'booking-001',
        status: BookingStatus.CONFIRMED,
      };
      mockBookingRepository.findOne.mockResolvedValueOnce(confirmedBooking);
      mockBookingRepository.save.mockResolvedValueOnce({
        ...confirmedBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('booking-001');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw when cancelling an already-cancelled booking', async () => {
      mockBookingRepository.findOne.mockResolvedValueOnce({
        id: 'booking-001',
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancelBooking('booking-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existing booking', async () => {
      mockBookingRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.cancelBooking('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
