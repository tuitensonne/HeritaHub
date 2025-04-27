import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('location')
@UseGuards(AuthGuard)

export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.create(createLocationDto);
  }

  // Need api to get all the location that is neerest to the user,... adding loaction will return some neer location for user to choose whether create new one or to use that

  @Get('nearby')
  getListOfLocations(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.locationService.getListOfLocations(latitude, longitude, page, limit);
  }


  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.locationService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
  //   return this.locationService.update(+id, updateLocationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.locationService.remove(+id);
  // }
}
