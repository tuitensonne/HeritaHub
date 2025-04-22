import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Culture_content, Prisma } from '@prisma/client';
import { CreateCultureContentDto } from './dto/culture_content.dto';
import { ApiResponseService } from '../api-response/api-response.service';
import { ApiResponseDto } from '../api-response/api-response.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import cuid from 'cuid';

@Injectable()
export class CultureContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
  ) {}

  async create(
    createCultureContentDto: CreateCultureContentDto,
  ): Promise<ApiResponseDto> {
    const { contentSections, ...mainData } = createCultureContentDto;

    try {
      const newContent = await this.prisma.$transaction(async (tx) => {
        const createdCultureContent = await tx.culture_content.create({
          data: {
            title: mainData.title,
            description: mainData.description,
            category: mainData.category,
          },
        });

        if (contentSections && contentSections.length > 0) {
          await tx.content_section.createMany({
            data: contentSections.map((sectionDto) => ({
              id: cuid(),
              title: sectionDto.title,
              content: sectionDto.content,
              culture_id: createdCultureContent.id,
              updated_at: new Date(),
            })),
          });
        }

        return createdCultureContent;
      });

      return this.apiResponse.success(
        'Tạo Culture Content thành công',
        newContent,
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target =
            (error.meta?.target as string[])?.join(', ') || 'trường nào đó';
          throw new ConflictException(
            this.apiResponse.error(`Giá trị cho ${target} đã tồn tại.`),
          );
        }
        console.error('Prisma Error:', error);
        throw new InternalServerErrorException(
          this.apiResponse.error(
            'Lỗi CSDL khi tạo Culture Content.',
            error.message,
          ),
        );
      }

      console.error('Unexpected Error:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Đã xảy ra lỗi không mong muốn khi tạo Culture Content.',
          error.message,
        ),
      );
    }
  }

  async findOne(id: string): Promise<ApiResponseDto> {
    try {
      const content = await this.prisma.culture_content.findUnique({
        where: { id: id },
        include: {
          Content: true,
        },
      });

      if (!content) {
        throw new NotFoundException(
          this.apiResponse.error(
            `Không tìm thấy Culture Content với ID "${id}"`,
          ),
        );
      }

      return this.apiResponse.success(
        'Lấy thông tin Culture Content thành công',
        content,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException(
          this.apiResponse.error('ID không hợp lệ.', error.message),
        );
      }
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi khi tìm kiếm Culture Content.',
          error.message,
        ),
      );
    }
  }

  async findAll(): Promise<ApiResponseDto> {
    try {
      const contents = await this.prisma.culture_content.findMany({
        include: {
          Content: true,
        },
      });
      return this.apiResponse.success(
        'Lấy danh sách Culture Content thành công',
        contents,
      );
    } catch (error) {
      console.error('Error finding all Culture Contents:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi khi lấy danh sách Culture Content.',
          error.message,
        ),
      );
    }
  }
}
