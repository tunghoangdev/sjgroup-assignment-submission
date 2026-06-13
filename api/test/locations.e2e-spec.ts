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
import { Booking } from './../src/bookings/entities/booking.entity';

describe('LocationsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

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
    // Clean up DB before each test
    await dataSource.query('TRUNCATE TABLE "bookings" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "locations" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "departments" CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create building (root location)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building Test',
        locationNumber: 'T-01',
        building: 'T',
        type: LocationType.BUILDING,
      })
      .expect(201);

    const body = response.body as { id: string; name: string };
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Building Test');
  });

  it('should reject creating floor/room without a parentId', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Floor Without Parent',
        locationNumber: 'T-F-NO-PARENT',
        building: 'T',
        type: LocationType.FLOOR,
      })
      .expect(400);
  });

  it('should reject creating non-room node with capacity or openTime', async () => {
    const buildingResponse = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building For Floor Test',
        locationNumber: 'T-BLDG-FLOOR',
        building: 'T',
        type: LocationType.BUILDING,
      })
      .expect(201);
    const building = buildingResponse.body as { id: string };

    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Floor Test',
        locationNumber: 'T-01-F1',
        building: 'T',
        type: LocationType.FLOOR,
        parent: { id: building.id },
        capacity: 10,
      })
      .expect(400);
  });

  it('should reject duplicate locationNumber', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building 1',
        locationNumber: 'T-DUP',
        building: 'T',
        type: LocationType.BUILDING,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building 2',
        locationNumber: 'T-DUP',
        building: 'T',
        type: LocationType.BUILDING,
      })
      .expect(400);
  });

  it('should build hierarchical tree', async () => {
    // 1. Root building
    const bldRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Building Test',
        locationNumber: 'T-BLD',
        building: 'T',
        type: LocationType.BUILDING,
      });

    // 2. Floor under building
    const floorRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        parent: { id: bldRes.body.id },
        name: 'Floor 1',
        locationNumber: 'T-FL1',
        building: 'T',
        type: LocationType.FLOOR,
      });

    // 3. Room under floor
    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        parent: { id: floorRes.body.id },
        name: 'Room 1',
        locationNumber: 'T-RM1',
        building: 'T',
        type: LocationType.ROOM,
        capacity: 10,
        openTime: 'Always open',
      });

    const response = await request(app.getHttpServer())
      .get('/api/v1/locations')
      .expect(200);

    type LocationNode = { locationNumber: string; children: LocationNode[] };
    const tree = response.body as LocationNode[];
    expect(tree.length).toBe(1);
    expect(tree[0].locationNumber).toBe('T-BLD');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].locationNumber).toBe('T-FL1');
    expect(tree[0].children[0].children.length).toBe(1);
    expect(tree[0].children[0].children[0].locationNumber).toBe('T-RM1');
  });

  it('should not allow deletion of node with children', async () => {
    const parentRes = await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        name: 'Parent',
        locationNumber: 'T-P',
        building: 'T',
        type: LocationType.BUILDING,
      });

    await request(app.getHttpServer())
      .post('/api/v1/locations')
      .send({
        parent: { id: parentRes.body.id },
        name: 'Child',
        locationNumber: 'T-C',
        building: 'T',
        type: LocationType.FLOOR,
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/locations/${parentRes.body.id}`)
      .expect(400);
  });
});
