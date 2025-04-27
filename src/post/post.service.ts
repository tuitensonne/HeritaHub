import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApiResponseService } from 'src/api-response/api-response.service';
import { MediaType } from './dto/create-post.dto';
import { MediaService } from 'src/media/media.service';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly apiResonponse: ApiResponseService,
    private readonly mediaService: MediaService,
    private readonly neo4jService: Neo4jService,
    private readonly cloudinary: CloudinaryService,
    private readonly httpService: HttpService,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const post = await prisma.post.create({
          data: {
            title: createPostDto.title,
            content: createPostDto.content,
            created_at: new Date(),
            post_audience: createPostDto.post_audience,
            user: { connect: { id: userId } },
            location: createPostDto.location_id
              ? { connect: { id: createPostDto.location_id } }
              : undefined,
          },
        });
  
        await prisma.user.update({
          where: { id: userId },
          data: { number_of_posts: { increment: 1 } },
        });
  
        const cloudinaryParams = {
          folder: `user_${userId}`,
          upload_preset: this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET'),
          api_url: this.configService.get<string>('CLOUDINARY_API_URL'),
        };
  
        await this.neo4jService.createPost(post.id);
  
        return this.apiResonponse.success("Create post successfully", {
          post,
          cloudinaryParams,
        });
      });
  
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  

  async addMediaToPost(postId: string, mediaUrl: string, mediaType: MediaType) {
    return this.apiResonponse.success(
      "Add media to post successfully", 
      await this.mediaService.addMedia(mediaUrl, mediaType, postId)
    )
  }

  async getUserPosts(userId: string, id: string, page: number, limit: number) {
    const totalPosts = await this.prisma.post.count({
      where: { userId: id }
    })
    const totalPages = Math.ceil(totalPosts / limit);
    const posts = await this.prisma.post.findMany({
      where: { userId: id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });
    for (const post of posts) {
      post['isLike'] = await this.neo4jService.isLike(userId, post.id)
    }
    return this.apiResonponse.success("Get user posts successfully", posts)
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.update({
      where: { id: id},
      data: {
        title: updatePostDto.title,
        content: updatePostDto.content,
        post_audience: updatePostDto.post_audience,
        thumbnail_url: updatePostDto.thumbnail_url,
      }
    })
    return this.apiResonponse.success("Update post successfully", post)
  }

  async reactToPost(userId: string, postId: string, action: string) {
    try {
      let incre = (action === "like" ? 1 : -1)
      const result = await this.prisma.$transaction(async (prisma) => {
        const post = await prisma.post.update({
          where: { id: postId },
          data: {
            like_counts: {increment: incre},
          }
        })
        await this.neo4jService.reactToPost(userId, postId, action)
        return post
      })
      return result
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(this.apiResonponse.error("Error in reacting to post", error))
    } 
  }

  async commentToPost(userId: string, postId: string, content: string) {
    try {
      const VIET_SPAM_HOST = this.configService.get<string>('VIET_SPAM_HOST');
      // const ENGLIST_SPAM_HOST = this.configService.get<string>('ENGLIST_SPAM_HOST');
      let response = await lastValueFrom(
        this.httpService.post(VIET_SPAM_HOST || '', {
            comment: content
        })
      );
      // if (response.data.result !== -1) {
      //   response = await lastValueFrom(
      //     this.httpService.post(`${ENGLIST_SPAM_HOST}?comment=${content}` || '', {
      //         comment: content
      //     })
      //   );
      // }
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            comment_counts: { increment: 1 },
          },
        });
        const comment = await this.prisma.comment.create({
          data: {
            content,
            userId: userId,
            postId: postId,
            state: response.data.result,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        });
  
        return this.apiResonponse.success("Comment successfully", {
          comment: {
            id: comment.id,
            content: comment.content,
            created_at: comment.createdAt,
          },
          user: {
            id: comment.user.id,
            name: comment.user.username,
            avatar_url: comment.user.avatar_url,
          },
        });   
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        this.apiResonponse.error("Error in commenting to post", error)
      );
    }
  }

  async getImageByPostId(postId: string) {
    try {
      const medias = await this.prisma.media.findMany({
        where: {
          postId: postId,
        }
      });
      return this.apiResonponse.success("Get list of images succesfully", medias)
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(this.apiResonponse.error("Error in getting post images", error));
    }
  }
 
  async getCommentByPostId(postId: string, pageOffset: number, limit: number) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: {
          postId: postId,
        },
        skip: (pageOffset - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc', 
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true, 
            },
          },
        },
      });
  
      const totalComments = await this.prisma.comment.count({
        where: {
          postId: postId,
        },
      });
  
      const totalPages = Math.ceil(totalComments / limit);
  
      const result = comments.map(comment => ({
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
        },
        user: {
          id: comment.user.id,
          name: comment.user.username,
          avatar_url: comment.user.avatar_url,
        },
      }));
  
      return this.apiResonponse.success("Get comment by post id successfully", {
        comments: result,
        totalComments,
        page: pageOffset,
        totalPages,
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(this.apiResonponse.error("Error in getting comments", error));
    }
  }
  
  async deleteAPost(postId: string) {
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const post = await prisma.post.delete({ where: { id: postId } });
        const user = await prisma.user.update({ where: {id: post.userId}, data: { number_of_posts: {decrement: 1}} })
        const medias = await prisma.media.findMany({ where: { postId } });
        await Promise.all(
          medias.map((media) =>
            this.cloudinary.deleteImageByUrl(media.image_url).catch((err) => {
              console.error(`Error deleting image: ${media.image_url}`, err);
            })
          )
        );
        await this.neo4jService.deletePost(postId);
        return this.apiResonponse.success("Delete post successfully", {
          post,
        });
      });
      return result
    } catch(err) {
      console.error(err)
      throw new InternalServerErrorException(this.apiResonponse.error("Fail to delete a post", err))
    }
  }

  async getUserFeedPost(userId: string, page: number, limit: number) {
    const followingFriends = await this.neo4jService.getFollowing(userId, userId);
    
    const followingIds = followingFriends.map(friend => friend.id);
    const posts = await this.prisma.post.findMany({
      where: {
        userId: {
          in: followingIds.length > 0 ? followingIds : ['dummy-id-123'],
        }
      },
      include: {
        user: {
          select: {
            username: true,
            avatar_url: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  
    const postsWithUserInfo = posts.map(post => ({
      ...post,
      username: post.user.username,
      avatar_url: post.user.avatar_url,
      user: undefined 
    }));
  
    return this.apiResonponse.success("Get Feed", postsWithUserInfo);
  }
}