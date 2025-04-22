// src/culture_content/dto/culture_content.dto.ts

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Culture_category } from '@prisma/client';

// DTO cho từng mục nội dung (Content Section)
export class CreateContentSectionDto {
  @IsString({ message: 'Tiêu đề Mục nội dung phải là một chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề Mục nội dung không được để trống' })
  @MaxLength(255, {
    message: 'Tiêu đề Mục nội dung không được vượt quá 255 ký tự',
  })
  title: string;

  @IsString({ message: 'Nội dung Mục nội dung phải là một chuỗi' })
  @IsNotEmpty({ message: 'Nội dung Mục nội dung không được để trống' })
  content: string;
}

// DTO chính cho tạo mới Culture Content
export class CreateCultureContentDto {
  @IsString({ message: 'Tiêu đề phải là một chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề không được vượt quá 255 ký tự' })
  title: string;

  @IsString({ message: 'Mô tả phải là một chuỗi' })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description: string;

  @IsEnum(Culture_category, { message: 'Danh mục không hợp lệ' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  category: Culture_category;

  @IsArray({ message: 'Các mục nội dung phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateContentSectionDto)
  @IsOptional()
  contentSections?: CreateContentSectionDto[];
}

// // DTO để cập nhật Culture Content
// import { PartialType } from '@nestjs/mapped-types';

// export class UpdateCultureContentDto extends PartialType(
//   CreateCultureContentDto,
// ) {}
