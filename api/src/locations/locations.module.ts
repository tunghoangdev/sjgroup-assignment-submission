import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location } from './entities/location.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Department])],
  providers: [LocationsService],
  controllers: [LocationsController],
  exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule {}
