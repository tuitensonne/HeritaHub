import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MediaModule } from 'src/media/media.module';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  imports: [MediaModule, Neo4jModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
