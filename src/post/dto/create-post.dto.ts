import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from "class-validator"

export enum Post_Audience {
  PRIVATE = "Private",
  PUBLIC = "Public",
  FRIENDS = "Friends"
}

export enum MediaType {
  IMAGE = "Image",
  VIDEO = "Video",
}

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(Post_Audience)
  post_audience: Post_Audience = Post_Audience.PUBLIC;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsString()
  location_id?: string
}