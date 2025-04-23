// src/culture_content/dto/culture_content.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
import { Culture_category } from '@prisma/client';
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
  // Removed: contentSections property
  // @IsArray({ message: 'Các mục nội dung phải là một mảng' })
  // @ValidateNested({ each: true })
  // @Type(() => NestedContentSectionInputDto)
  // @IsOptional()
  // contentSections?: NestedContentSectionInputDto[];
}
