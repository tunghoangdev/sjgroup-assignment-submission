process.env.TZ = 'UTC';
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import {
  Location,
  LocationType,
} from './../src/locations/entities/location.entity';
import {
  Booking,
  BookingStatus,
} from './../src/bookings/entities/booking.entity';
import { Department } from './../src/departments/entities/department.entity';

describe('BookingsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let roomFixture: Location;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Clean up using TRUNCATE CASCADE to bypass foreign keys
    await dataSource.query('TRUNCATE TABLE "bookings" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "locations" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "departments" CASCADE;');

    const dept = await dataSource.getRepository(Department).save({
      code: 'EFM',
      name: 'Facilities Management',
    });

    const bldRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building A',
        locationNumber: 'B-A',
        building: 'A',
        type: LocationType.BUILDING,
      });

    const floorRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        parent: { id: bldRes.body.id },
        name: 'Floor 1',
        locationNumber: 'B-A-F1',
        building: 'A',
        type: LocationType.FLOOR,
      });

    if (floorRes.status !== 201) {
      console.log('Floor creation failed:', floorRes.body);
    }

    const roomRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        parent: { id: floorRes.body.id },
        name: 'Meeting Room 1',
        locationNumber: 'A-01-01',
        building: 'A',
        type: LocationType.ROOM,
        department: { id: dept.id },
        capacity: 10,
        openTime: 'Mon to Fri (9AM to 6PM)',
      });

    roomFixture = await dataSource.manager.getTreeRepository(Location).findOne({
      where: { id: roomRes.body.id }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create booking successfully (happy path)', async () => {
    // A Wednesday between 9AM and 6PM, e.g. 2026-06-10T10:00:00Z (Wednesday)
    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 5,
        startTime: '2026-06-10T10:00:00Z',
        endTime: '2026-06-10T11:00:00Z',
      });

    // console.log(response.body);
    expect(response.status).toBe(201);

    const body = response.body as { id: string; status: string };
    expect(body.id).toBeDefined();
    expect(body.status).toBe(BookingStatus.CONFIRMED);
  });

  it('should reject booking due to department mismatch', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'FSS', // Expected: EFM
        attendees: 5,
        startTime: '2026-06-10T10:00:00Z',
        endTime: '2026-06-10T11:00:00Z',
      })
      .expect(400);

    // Verify rejection history in DB
    const list = await dataSource.getRepository(Booking).find();
    expect(list.length).toBe(1);
    expect(list[0].status).toBe(BookingStatus.REJECTED);
    expect(list[0].rejectReason).toContain('department mismatch');
  });

  it('should reject booking due to exceeding capacity', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 15, // Max capacity: 10
        startTime: '2026-06-10T10:00:00Z',
        endTime: '2026-06-10T11:00:00Z',
      })
      .expect(400);

    // Verify rejection history in DB
    const list = await dataSource.getRepository(Booking).find();
    expect(list.length).toBe(1);
    expect(list[0].status).toBe(BookingStatus.REJECTED);
    expect(list[0].rejectReason).toContain('capacity exceeded');
  });

  it('should reject booking due to time outside operational hours', async () => {
    // Wednesday 8PM (outside 9AM - 6PM)
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 5,
        startTime: '2026-06-10T20:00:00Z',
        endTime: '2026-06-10T21:00:00Z',
      })
      .expect(400);

    // Saturday booking (room is Mon to Fri)
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 5,
        startTime: '2026-06-13T10:00:00Z', // Saturday
        endTime: '2026-06-13T11:00:00Z',
      })
      .expect(400);
  });

  it('should reject overlapping booking', async () => {
    // First booking (confirmed)
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 5,
        startTime: '2026-06-10T09:00:00Z',
        endTime: '2026-06-10T10:00:00Z',
      })
      .expect(201);

    // Second booking overlapping first one
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        locationId: roomFixture.id,
        bookedBy: 'EFM',
        attendees: 5,
        startTime: '2026-06-10T09:30:00Z',
        endTime: '2026-06-10T10:30:00Z',
      })
      .expect(400);
  });
});
