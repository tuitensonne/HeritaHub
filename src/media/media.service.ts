import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MediaType } from 'src/post/dto/create-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/api-response/api-response.service';
@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
  ) {}  


  async addMedia(mediaUrl: string, mediaType: MediaType, postId: string) {
    try {
      const media = await this.prisma.media.create({
        data: {
          image_url: mediaUrl,
          type: mediaType,
          post: { connect: { id: postId } }
        }
      });
      
      return { success: true, mediaId: media.id };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
