import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, UsePipes, ValidationPipe, Sse, Req, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, MediaType } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('post')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}))

export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(
    @Req() req,
    @Body() createPostDto: CreatePostDto
  ) {
    return this.postService.create(req.user.sub, createPostDto);
  }

  @Get(':id/posts')
  getUserPosts(
    @Req() req,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    return this.postService.getUserPosts(req.user.sub, id, page, limit);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Post(':id/media')
  addMedia(
    @Param('id') postId: string, 
    @Body() mediaData: { url: string, type: MediaType }
  ) {
    return this.postService.addMediaToPost(postId, mediaData.url, mediaData.type);
  }

  @Post(':id') 
  reactToPost(
    @Req() req,
    @Param('id') postId: string,
    @Query('action') action: string = 'like'
  ) {
    return this.postService.reactToPost(req.user.sub, postId, action);
  }

  @Post(':id/comment')
  commentOnPost(
    @Req() req,
    @Param('id') postId: string,
    @Body() commentData: { content: string }
  ) {
    return this.postService.commentToPost(req.user.sub, postId, commentData.content);
  }

  @Get(':id/comments') 
  getCommentByPostId( 
    @Param('id') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postService.getCommentByPostId(postId, page, limit);
  }

  @Delete(':id')
  deleteAPost(
    @Param('id') postId: string 
  ) {
    return this.postService.deleteAPost(postId)
  }
}
