import { Global, Injectable } from '@nestjs/common';
import { MediaType } from 'src/post/dto/create-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}  


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
