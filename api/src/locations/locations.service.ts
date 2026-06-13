import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryFailedError, TreeRepository } from 'typeorm';
import { Location, LocationType } from './entities/location.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  private readonly locationRepository: TreeRepository<Location>;

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly dataSource: DataSource,
  ) {
    this.locationRepository = this.dataSource.getTreeRepository(Location);
  }

  private validateLocationFields(
    type: LocationType,
    hasParent: boolean,
    capacity?: number,
    openTime?: string,
    hasDepartment?: boolean,
  ) {
    // Non-building types must have a parent
    if (type !== LocationType.BUILDING && !hasParent) {
      throw new BadRequestException(
        `A location of type '${type}' must have a parent location.`,
      );
    }

    if (type !== LocationType.ROOM) {
      if (capacity !== undefined && capacity !== null) {
        throw new BadRequestException(
          'Capacity is only applicable to room-level nodes.',
        );
      }
      if (openTime !== undefined && openTime !== null) {
        throw new BadRequestException(
          'Open time is only applicable to room-level nodes.',
        );
      }
      if (hasDepartment) {
        throw new BadRequestException(
          'Department is only applicable to room-level nodes.',
        );
      }
    }
  }

  private handleQueryError(error: any): never {
    if (error instanceof QueryFailedError) {
      const err = error as any;
      // Postgres Unique Constraint Violation
      if (err.code === '23505') {
        throw new BadRequestException(
          `Location number must be unique.`,
        );
      }
      // Postgres Foreign Key Violation
      if (err.code === '23503') {
        if (err.detail.includes('parent_id')) {
          throw new NotFoundException(`Parent location not found.`);
        }
        if (err.detail.includes('department_id')) {
          throw new NotFoundException(`Department not found.`);
        }
        throw new BadRequestException(`Invalid reference: ${err.detail}`);
      }
    }
    throw error;
  }

  async createLocation(
    createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    this.validateLocationFields(
      createLocationDto.type,
      !!createLocationDto.parent,
      createLocationDto.capacity,
      createLocationDto.openTime,
      !!createLocationDto.department,
    );

    const location = this.locationRepository.create(createLocationDto);

    try {
      return await this.locationRepository.save(location);
    } catch (error) {
      this.handleQueryError(error);
    }
  }

  async getTree(): Promise<Location[]> {
    return this.dataSource.getTreeRepository(Location).findTrees({
      relations: ['department'],
    });
  }

  async getLocationById(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['department', 'parent'],
    });
    if (!location) {
      throw new NotFoundException(`Location with ID '${id}' not found.`);
    }

    // Include immediate children
    const children = await this.locationRepository.find({
      where: { parent: { id } },
      relations: ['department'],
    });
    location.children = children;

    return location;
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    const location = await this.getLocationById(id);

    const newType =
      updateLocationDto.type !== undefined
        ? updateLocationDto.type
        : location.type;
    const newCapacity =
      updateLocationDto.capacity !== undefined
        ? updateLocationDto.capacity
        : location.capacity;
    const newOpenTime =
      updateLocationDto.openTime !== undefined
        ? updateLocationDto.openTime
        : location.openTime;
        
    const hasDepartment = updateLocationDto.department !== undefined 
        ? !!updateLocationDto.department 
        : !!location.department;
        
    const hasParent = updateLocationDto.parent !== undefined
        ? !!updateLocationDto.parent
        : !!location.parent;

    this.validateLocationFields(
      newType,
      hasParent,
      newCapacity ?? undefined,
      newOpenTime ?? undefined,
      hasDepartment,
    );

    if (updateLocationDto.parent?.id === id) {
      throw new BadRequestException('A location cannot be its own parent.');
    }

    // Merge changes
    Object.assign(location, updateLocationDto);

    try {
      return await this.locationRepository.save(location);
    } catch (error) {
      this.handleQueryError(error);
    }
  }

  async deleteLocation(id: string): Promise<void> {
    // Check if node has children
    const childCount = await this.locationRepository.count({
      where: { parent: { id } },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete a location that has children.',
      );
    }

    const result = await this.locationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID '${id}' not found.`);
    }
  }
}
