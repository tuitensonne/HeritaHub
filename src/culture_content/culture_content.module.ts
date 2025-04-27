import { Module } from '@nestjs/common';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ApiResponseModule } from 'src/api-response/api-response.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CultureContentController } from './culture_content.controller';
import { CultureContentService } from './culture_content.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    Neo4jModule, // Assuming Neo4j is still needed for other parts
    ApiResponseModule,
    CloudinaryModule, // Assuming Cloudinary is still needed
    HttpModule
    // PrismaModule, // Uncomment if PrismaService isn't global
  ],
  controllers: [CultureContentController],
  providers: [CultureContentService],
})
export class CultureContentModule {}
