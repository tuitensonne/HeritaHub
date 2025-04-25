import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApiResponseService } from 'src/api-response/api-response.service';
import { MediaType } from './dto/create-post.dto';
import { MediaService } from 'src/media/media.service';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly apiResonponse: ApiResponseService,
    private readonly mediaService: MediaService,
    private readonly neo4jService: Neo4jService,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    try {
      const post = await this.prisma.post.create({
        data: {
          title: createPostDto.title,
          content: createPostDto.content,
          created_at: new Date(),
          post_audience: createPostDto.post_audience,
          user: { connect: { id: userId } },
        },
      });

      const cloudinaryParams = {
        folder: `user_${userId}`,
        upload_preset: this.configService.get<string>(
          'CLOUDINARY_UPLOAD_PRESET',
        ),
        api_url: this.configService.get<string>('CLOUDINARY_API_URL'),
      };

      return this.apiResonponse.success('Create post successfully', {
        post,
        cloudinaryParams,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async addMediaToPost(postId: string, mediaUrl: string, mediaType: MediaType) {
    return this.apiResonponse.success(
      'Add media to post successfully',
      await this.mediaService.addMedia(mediaUrl, mediaType, postId),
    );
  }

  async getUserPosts(userId: string, id: string, page: number, limit: number) {
    const totalPosts = await this.prisma.post.count({
      where: { userId: id },
    });
    const totalPages = Math.ceil(totalPosts / limit);
    const posts = await this.prisma.post.findMany({
      where: { userId: id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    for (const post of posts) {
      post['isLike'] = await this.neo4jService.isLike(userId, post.id);
    }
    return this.apiResonponse.success('Get user posts successfully', posts);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.update({
      where: { id: id },
      data: {
        title: updatePostDto.title,
        content: updatePostDto.content,
        post_audience: updatePostDto.post_audience,
        thumbnail_url: updatePostDto.thumbnail_url,
      },
    });
    return this.apiResonponse.success('Update post successfully', post);
  }

  async reactToPost(userId: string, postId: string, action: string) {
    try {
      let incre = action === 'like' ? 1 : -1;
      const post = await this.prisma.post.update({
        where: { id: postId },
        data: {
          like_counts: { increment: incre },
        },
      });
      await this.neo4jService.reactToPost(userId, postId, action);
      return post;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        this.apiResonponse.error('Error in reacting to post', error),
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
