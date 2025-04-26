import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { updateProfile } from './dto/user.dto';
import { ApiResponseService } from 'src/api-response/api-response.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
    private readonly cloudinary: CloudinaryService,
    private readonly neo4j: Neo4jService,
  ) {}

  async getProfile(userID: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userID },
    });
    if (!user)
      throw new NotFoundException(
        this.apiResponse.error("Can't find user by ID"),
      );
    return this.apiResponse.success('Get profile successful', user);
  }

  async updateProfile(
    userId: string,
    updateProfileDTO: updateProfile,
    file?: Express.Multer.File,
  ) {
    let uploadResult: { secure_url: string; public_id: string } | null = null;
    try {
      if (file) {
        uploadResult = (await this.cloudinary.uploadImageFile(file)) as {
          secure_url: string;
          public_id: string;
        };
        const neo4jUser = await this.neo4j.updateProfileAvatar(
          userId,
          uploadResult.secure_url,
        );
      }
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateProfileDTO,
          ...(uploadResult?.secure_url && {
            avatar_url: uploadResult.secure_url,
          }),
        },
      });

      if (
        file &&
        updateProfileDTO.avatar_url &&
        updateProfileDTO.avatar_url !== 'null' &&
        updateProfileDTO.avatar_url !== 'undefined'
      ) {
        await this.cloudinary.deleteImageByUrl(updateProfileDTO.avatar_url);
      }

      return this.apiResponse.success(
        'Update profile successfully',
        updatedUser,
      );
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(
            this.apiResponse.error('Email already exists'),
          );
        } else if (err.code === 'P2025') {
          throw new NotFoundException(this.apiResponse.error('User not found'));
        }
      }
      throw err;
    }
  }

  async followFriend(userId: string, friendId: string) {
    const friend = await this.prisma.user.count({
      where: { id: friendId },
    });

    if (!friend) {
      throw new NotFoundException(this.apiResponse.error('User is not found'));
    }
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const [userUpdate, friendUpdate] = await Promise.all([
          prisma.user.update({
            where: { id: userId },
            data: { following: { increment: 1 } },
            select: { id: true } 
          }),
          prisma.user.update({
            where: { id: friendId },
            data: { follower: { increment: 1 } },
            select: { id: true } 
          })
        ]);
        return this.neo4j.followUser(userId, friendId);
      });
  
      return this.apiResponse.success('Unfollow user successfully', result);
    } catch (error) {
      console.log('Error following user:', error);
      throw new BadRequestException(
        this.apiResponse.error('Error happened when adding friend', error),
      );
    }
  }

  async unFollowFriend(userId: string, friendId: string) {
    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friend) {
      throw new NotFoundException(this.apiResponse.error('User is not found'));
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id: userId },
          data: {
            following: {
              decrement: 1,
            },
          },
        });

        await prisma.user.update({
          where: { id: friendId },
          data: {
            follower: {
              decrement: 1,
            },
          },
        });

        const neo4jResult = await this.neo4j.unFollowUser(userId, friendId);

        return neo4jResult;
      });

      return this.apiResponse.success('Unfollow user successfully', result);
    } catch (error) {
      console.log('Error unfollowing user:', error);
      throw new BadRequestException(
        this.apiResponse.error('Error happened when unfollowing user', error)
      );
    }
  }

  async getFollowing(userId: string, friendId: string) {
    try {
      const result = await this.neo4j.getFollowing(userId, friendId);
      return this.apiResponse.success('Get list follower successfully', result);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        this.apiResponse.error('Error happened when adding friend', error),
      );
    }
  }

  async getFollowed(userId: string, friendId: string) {
    try {
      const result = await this.neo4j.getFollowed(userId, friendId);
      return this.apiResponse.success('Get list followed successfully', result);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        this.apiResponse.error('Error happened when adding friend', error),
      );
    }
  }

  async getGeneralProfile(reqUserId: string, userId: string) {
    const [isFollowing, user] = await Promise.all([
      this.neo4j.isFollowing(reqUserId, userId),
      this.prisma.user.findFirst({
        where: { id: userId },
        select: {
          username: true,
          follower: true,
          following: true,
          avatar_url: true,
          number_of_posts: true,
        },
      }),
    ]);

    if (user) {
      user['isFollowing'] = isFollowing;
    }
    return this.apiResponse.success('Successfully', user);
  }
  async checkMutualFollow(userId1: string, userId2: string): Promise<boolean> {
    const [user1FollowsUser2, user2FollowsUser1] = await Promise.all([
      this.neo4j.checkFollow(userId1, userId2),
      this.neo4j.checkFollow(userId2, userId1),
    ]);

    return user1FollowsUser2 && user2FollowsUser1;
  }
}
