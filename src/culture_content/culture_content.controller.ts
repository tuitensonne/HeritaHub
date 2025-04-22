// src/culture_content/culture_content.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Patch,
  Delete,
} from '@nestjs/common';
import { CultureContentService } from './culture_content.service';
import {
  CreateCultureContentDto,
} from './dto/culture_content.dto';

@Controller('culture-content')
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
export class CultureContentController {
  constructor(private readonly cultureContentService: CultureContentService) {}

  @Post()
  create(@Body() createCultureContentDto: CreateCultureContentDto) {
    return this.cultureContentService.create(createCultureContentDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const content = await this.cultureContentService.findOne(id);
    if (!content) {
      throw new NotFoundException(
        `Không tìm thấy Culture Content với ID "${id}"`,
      );
    }
    return content;
  }

  @Get()
  findAll() {
    return this.cultureContentService.findAll();
  }
}
