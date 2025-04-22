import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { updateProfile } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
@UseGuards(AuthGuard)

export class UserController {
  constructor(private readonly userService: UserService,
  ) {}

  // To follow someone
  @Post('following') 
  async followFriend(
    @Req() req,
    @Query('friend_id') friendId: string
  ) {
    return this.userService.followFriend(req.user.sub, friendId)
  }

  // Return a list of person that you follow
  @Get('following') 
  async getFollowing(
    @Req() req,
    @Query('friend_id') friendId: string
  ) {
    return this.userService.getFollowing(req.user.sub, friendId)    
  }

  // Return a list of person that follow you
  @Get('followed') 
  async getFollowed(
    @Req() req,
    @Query('friend_id') friendId: string
  ) {
    return this.userService.getFollowed(req.user.sub, friendId)  
  }
  
  // Unfollow someone that you have followed
  @Delete('following') 
  async unFollowFriend(
    @Req() req,
    @Query('friend_id') friendId: string
  ) {
    return this.userService.unFollowFriend(req.user.sub, friendId)
  }

  // Unfollow someone that you have followed
  @Delete('follower') 
  async friendUnfollow(
    @Req() req,
    @Query('friend_id') friendId: string
  ) {
    return this.userService.unFollowFriend(friendId, req.user.sub)
  }

  @Get('general-profile')
  async getGeneralProfile(
    @Req() req,
    @Query('userId') userId: string
  ) {
    return this.userService.getGeneralProfile(req.user.sub, userId)
  }

  @Get('profile')
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.sub)
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('file')) 
  async updateProfile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req, 
    @Body() userDTO: updateProfile
  ) {
    return this.userService.updateProfile(req.user.sub, userDTO, file)
  }

}
