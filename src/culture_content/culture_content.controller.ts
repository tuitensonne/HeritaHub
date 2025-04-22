import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { CultureContentService } from './culture_content.service';
import { CreateCultureContentDto } from './dto/culture_content.dto';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const content = await this.cultureContentService.findOne(id);

    if (!content) {
      // Giữ lại việc throw lỗi ở đây là an toàn nhất nếu không chắc service đã làm
      throw new NotFoundException(
        `Không tìm thấy Culture Content với ID "${id}"`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return content;
  }
}
