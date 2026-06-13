import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LocationsService } from '../locations/locations.service';
import { LocationType } from '../locations/entities/location.entity';
import { DataSource } from 'typeorm';
import { Department } from '../departments/entities/department.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Location } from '../locations/entities/location.entity';

async function bootstrap() {
  console.log('Starting DB Seeding...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);
  const dataSource = app.get(DataSource);
  const departmentRepository = dataSource.getRepository(Department);

  try {
    // 0. Clear tables in order (cascade)
    await dataSource.query('TRUNCATE TABLE "bookings" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "locations" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "departments" CASCADE;');

    // 1. Seed Departments
    const depts = [
      { code: 'EFM', name: 'Facilities Management' },
      { code: 'FSS', name: 'Financial Services' },
      { code: 'AVS', name: 'Audio Visual Services' },
      { code: 'ASS', name: 'Administrative Support Services' },
    ];

    const createdDepts: { [code: string]: Department } = {};
    for (const d of depts) {
      const savedDept = await departmentRepository.save(
        departmentRepository.create(d),
      );
      createdDepts[d.code] = savedDept;
      console.log(`Created Department: ${d.code}`);
    }

    // 2. Create Building A (Root)
    const bldA = await locationsService.createLocation({
      name: 'Building A',
      locationNumber: 'A',
      building: 'A',
      type: LocationType.BUILDING,
    });
    console.log(`Created: ${bldA.name}`);

    // 3. Create Floor 1 under Building A
    const floor1 = await locationsService.createLocation({
      parent: { id: bldA.id },
      name: 'Floor 1',
      locationNumber: 'A-01',
      building: 'A',
      type: LocationType.FLOOR,
    });
    console.log(`Created: ${floor1.name}`);

    // 4. Create Rooms/Areas under Floor 1
    const lobbyA = await locationsService.createLocation({
      parent: { id: floor1.id },
      name: 'Lobby Level 1',
      locationNumber: 'A-01-Lobby',
      building: 'A',
      type: LocationType.ROOM,
    });
    console.log(`Created: ${lobbyA.name}`);

    const mr1 = await locationsService.createLocation({
      parent: { id: floor1.id },
      name: 'Meeting Room 1',
      locationNumber: 'A-01-01',
      building: 'A',
      type: LocationType.ROOM,
      department: { id: createdDepts['EFM'].id },
      capacity: 10,
      openTime: 'Mon to Fri (9AM to 6PM)',
    });
    console.log(`Created: ${mr1.name}`);

    const mr2 = await locationsService.createLocation({
      parent: { id: floor1.id },
      name: 'Meeting Room 2',
      locationNumber: 'A-01-02',
      building: 'A',
      type: LocationType.ROOM,
      department: { id: createdDepts['FSS'].id },
      capacity: 50,
      openTime: 'Mon to Fri (9AM to 6PM)',
    });
    console.log(`Created: ${mr2.name}`);

    const corridorA = await locationsService.createLocation({
      parent: { id: floor1.id },
      name: 'Corridor Floor 1',
      locationNumber: 'A-01-Corridor',
      building: 'A',
      type: LocationType.ROOM,
    });
    console.log(`Created: ${corridorA.name}`);

    const mr3 = await locationsService.createLocation({
      parent: { id: floor1.id },
      name: 'Meeting Room 3',
      locationNumber: 'A-01-03',
      building: 'A',
      type: LocationType.ROOM,
      department: { id: createdDepts['AVS'].id },
      capacity: 5,
      openTime: 'Mon to Sat (9AM to 6PM)',
    });
    console.log(`Created: ${mr3.name}`);

    // 5. Create Building B (Root)
    const bldB = await locationsService.createLocation({
      name: 'Building B',
      locationNumber: 'B',
      building: 'B',
      type: LocationType.BUILDING,
    });
    console.log(`Created: ${bldB.name}`);

    // 6. Create Floor 5 under Building B
    const floor5 = await locationsService.createLocation({
      parent: { id: bldB.id },
      name: 'Floor 5',
      locationNumber: 'B-05',
      building: 'B',
      type: LocationType.FLOOR,
    });
    console.log(`Created: ${floor5.name}`);

    // 7. Create Rooms/Areas under Floor 5
    const utilityRoom = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Utility Room',
      locationNumber: 'B-05-11',
      building: 'B',
      type: LocationType.ROOM,
      department: { id: createdDepts['ASS'].id },
      capacity: 30,
      openTime: 'Always open',
    });
    console.log(`Created: ${utilityRoom.name}`);

    const sanitaryRoom = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Sanitary Room',
      locationNumber: 'B-05-12',
      building: 'B',
      type: LocationType.ROOM,
      department: { id: createdDepts['EFM'].id },
      capacity: 10,
      openTime: 'Mon to Fri (9AM to 6PM)',
    });
    console.log(`Created: ${sanitaryRoom.name}`);

    const meetingToilet = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Meeting Toilet',
      locationNumber: 'B-05-13',
      building: 'B',
      type: LocationType.ROOM,
      department: { id: createdDepts['EFM'].id },
      capacity: 10,
      openTime: 'Mon to Fri (9AM to 6PM)',
    });
    console.log(`Created: ${meetingToilet.name}`);

    const gensetRoom = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Genset Room',
      locationNumber: 'B-05-14',
      building: 'B',
      type: LocationType.ROOM,
      department: { id: createdDepts['ASS'].id },
      capacity: 100,
      openTime: 'Mon to Sun (9AM to 6PM)',
    });
    console.log(`Created: ${gensetRoom.name}`);

    const pantryB = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Pantry Floor 5',
      locationNumber: 'B-05-15',
      building: 'B',
      type: LocationType.ROOM,
    });
    console.log(`Created: ${pantryB.name}`);

    const corridorB = await locationsService.createLocation({
      parent: { id: floor5.id },
      name: 'Corridor Floor 5',
      locationNumber: 'B-05-Corridor',
      building: 'B',
      type: LocationType.ROOM,
    });
    console.log(`Created: ${corridorB.name}`);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

void bootstrap();
