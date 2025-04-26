import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { ApiResponseModule } from 'src/api-response/api-response.module';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  imports: [ApiResponseModule, Neo4jModule],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
