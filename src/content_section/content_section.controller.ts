// src/content_section/content_section.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ContentSectionService } from './content_section.service';
import { CreateContentSectionDto, MediaType } from './dto/content_section.dto';
import { ApiResponseDto } from 'src/api-response/api-response.dto'; // Import để type hint
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('content-sections')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
)
export class ContentSectionController {
  constructor(private readonly contentSectionService: ContentSectionService) {}

  @Post()
  async create(
    @Body() createContentSectionDto: CreateContentSectionDto,
  ): Promise<ApiResponseDto> {
    return this.contentSectionService.create(createContentSectionDto);
  }
  @Get('by-culture/:cultureId') // Route riêng để lấy theo ID cha
  async findAllByCulture(
    @Param('cultureId') cultureId: string, // Thêm ParseUUIDPipe nếu cultureId là UUID: @Param('cultureId', ParseUUIDPipe) cultureId: string
  ): Promise<ApiResponseDto> {
    return this.contentSectionService.findAllByCultureContent(cultureId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string, // Thêm ParseUUIDPipe nếu section ID là UUID: @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponseDto> {
    // Service đã handle NotFoundException, nên controller chỉ cần gọi
    return this.contentSectionService.findOne(id);
  }
  //   @Patch(':id')
  //   async update(
  //     @Param('id') id: string, // Thêm ParseUUIDPipe nếu ID là UUID
  //     @Body() updateContentSectionDto: UpdateContentSectionDto,
  //   ): Promise<ApiResponseDto> {
  //     return this.contentSectionService.update(id, updateContentSectionDto);
  //   }

  @Delete(':id')
  async remove(
    @Param('id') id: string, // Thêm ParseUUIDPipe nếu ID là UUID
  ): Promise<ApiResponseDto> {
    return this.contentSectionService.remove(id);
  }
  @Post(':id/media')
  addMedia(
    @Param('id') contentSectionId: string,
    @Body() mediaData: { url: string; type: MediaType },
  ) {
    return this.contentSectionService.addMediaToContentSection(
      contentSectionId,
      mediaData.url,
      mediaData.type,
    );
  }
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-image')
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.contentSectionService.uploadImage(file);
    return result;
  }
}
