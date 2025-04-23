// src/content_section/dto/content_section.dto.ts

import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
export enum MediaType {
  IMAGE = 'Image',
  VIDEO = 'Video',
}
export class CreateContentSectionDto {
  @IsString({ message: 'Tiêu đề Mục nội dung phải là một chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề Mục nội dung không được để trống' })
  @MaxLength(255, {
    message: 'Tiêu đề Mục nội dung không được vượt quá 255 ký tự',
  })
  title: string;

  @IsString({ message: 'Nội dung Mục nội dung phải là một chuỗi' })
  content: string;

  @IsString({ message: 'ID Culture Content cha phải là chuỗi' })
  @IsNotEmpty({ message: 'ID Culture Content cha không được để trống' })
  culture_id: string;
}
