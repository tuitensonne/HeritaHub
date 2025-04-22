import { Module } from '@nestjs/common';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ApiResponseModule } from 'src/api-response/api-response.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CultureContentController } from './culture_content.controller';
import { CultureContentService } from './culture_content.service';

@Module({
  imports: [Neo4jModule, ApiResponseModule, CloudinaryModule],
  controllers: [CultureContentController],
  providers: [CultureContentService],
})
export class CultureContentModule {}
