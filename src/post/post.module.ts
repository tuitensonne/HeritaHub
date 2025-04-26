import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MediaModule } from 'src/media/media.module';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [CloudinaryModule, MediaModule, Neo4jModule, HttpModule],
  controllers: [PostController],
  providers: [PostService], 
}) 
export class PostModule {}
