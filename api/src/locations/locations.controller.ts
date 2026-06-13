import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('locations')
@Controller({ path: 'locations', version: '1' })
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location node' })
  @ApiResponse({ status: 201, description: 'Location created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.createLocation(createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the full hierarchical location tree' })
  @ApiResponse({ status: 200, description: 'Return full location tree.' })
  findAll() {
    return this.locationsService.getTree();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single location by ID with its direct children',
  })
  @ApiResponse({ status: 200, description: 'Return location details.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.getLocationById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location node attributes' })
  @ApiResponse({ status: 200, description: 'Location updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location node' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g. node has children).',
  })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.deleteLocation(id);
  }
}
