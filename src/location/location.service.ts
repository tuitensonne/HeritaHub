import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/api-response/api-response.service';

@Injectable()
export class LocationService {

  constructor (
    private readonly apiResponse: ApiResponseService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createLocationDto: CreateLocationDto) {
    try {
      const location = await this.prisma.location.create({
        data: {
          name: createLocationDto.name,
          latitude: createLocationDto.latitude,
          longitude: createLocationDto.longitude,
          address: createLocationDto.address,
        }
      })
      return this.apiResponse.success("Location created successfully", location);
    } catch (error) {
      console.error('Error creating location:', error);
      throw new InternalServerErrorException('Failed to create location');
    }
  }

  async getListOfLocations(latitude: number, longitude: number, page: number, limit: number) {
    try {
      const offset = (page - 1) * limit;
      const locationsRaw = await this.prisma.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        address: string;
        post_count: bigint;
        distance: number;
      }>>(`
        SELECT
          l.id,
          l.name,
          l.latitude,
          l.longitude,
          l.address,
          COUNT(pl.postId) AS post_count,
          (
            6371 * ACOS(
              COS(RADIANS(${latitude})) * COS(RADIANS(l.latitude)) *
              COS(RADIANS(l.longitude) - RADIANS(${longitude})) +
              SIN(RADIANS(${latitude})) * SIN(RADIANS(l.latitude))
            )
          ) AS distance
        FROM Location l
        LEFT JOIN PostLocation pl ON l.id = pl.locationId
        GROUP BY l.id, l.name, l.latitude, l.longitude, l.address
        ORDER BY distance ASC, post_count DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `);
  
      const locations = locationsRaw.map(location => ({
        ...location,
        post_count: Number(location.post_count),
        distance: Number(location.distance)
      }));
  
      return this.apiResponse.success("Locations fetched successfully", locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw new InternalServerErrorException('Failed to fetch locations');
    }
  }
}