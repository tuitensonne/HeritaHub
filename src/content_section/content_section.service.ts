// src/content_section/content_section.service.ts

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Content_section, Prisma } from '@prisma/client';
import { ApiResponseService } from '../api-response/api-response.service';
import { ApiResponseDto } from '../api-response/api-response.dto';
import { CreateContentSectionDto, MediaType } from './dto/content_section.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { MediaService } from 'src/media/media.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
// import { cuid } from '@prisma/client/runtime/library'; // Hoặc uuid

@Injectable()
export class ContentSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
    private readonly mediaService: MediaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Tạo một Content Section mới và liên kết với Culture Content cha.
   * @param createDto Dữ liệu tạo section.
   * @returns ApiResponseDto chứa section mới được tạo.
   */
  async create(createDto: CreateContentSectionDto): Promise<ApiResponseDto> {
    try {
      // 1. Kiểm tra xem Culture Content cha có tồn tại không
      const parentExists = await this.prisma.culture_content.findUnique({
        where: { id: createDto.culture_id },
        select: { id: true }, // Chỉ cần lấy id để kiểm tra sự tồn tại
      });

      if (!parentExists) {
        throw new NotFoundException(
          this.apiResponse.error(
            `Không tìm thấy Culture Content với ID "${createDto.culture_id}" để tạo Section con.`,
          ),
        );
      }

      // 2. Tạo Content Section mới
      const newSection = await this.prisma.content_section.create({
        data: {
          title: createDto.title,
          content: createDto.content,
          culture_id: createDto.culture_id,
          updated_at: new Date(),
        },
      });

      return this.apiResponse.success(
        'Tạo Content Section thành công',
        newSection,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException(
            this.apiResponse.error(
              `Tham chiếu đến Culture Content "${createDto.culture_id}" không hợp lệ.`,
            ),
          );
        }
        console.error('Prisma Error:', error);
        throw new InternalServerErrorException(
          this.apiResponse.error(
            'Lỗi CSDL khi tạo Content Section.',
            error.message,
          ),
        );
      }
      console.error('Unexpected error creating content section:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi không mong muốn khi tạo Content Section.',
          error.message,
        ),
      );
    }
  }

  /**
   * Lấy thông tin chi tiết một Content Section bằng ID.
   * @param id ID của section.
   * @returns ApiResponseDto chứa thông tin section.
   */
  async addMediaToContentSection(
    conentSectionId: string,
    mediaUrl: string,
    mediaType: MediaType,
  ) {
    return this.apiResponse.success(
      'Add media to post successfully',
      await this.mediaService.addMediaForDocument(
        mediaUrl,
        mediaType,
        conentSectionId,
      ),
    );
  }
  async findOne(id: string): Promise<ApiResponseDto> {
    try {
      const section = await this.prisma.content_section.findUnique({
        where: { id },
      });

      if (!section) {
        throw new NotFoundException(
          this.apiResponse.error(
            `Không tìm thấy Content Section với ID "${id}"`,
          ),
        );
      }

      return this.apiResponse.success(
        'Lấy thông tin Content Section thành công',
        section,
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
      console.error('Error finding content section:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi khi tìm kiếm Content Section.',
          error.message,
        ),
      );
    }
  }
  async findAllByCultureContent(cultureId: string): Promise<ApiResponseDto> {
    try {
      const parentExists = await this.prisma.culture_content.findUnique({
        where: { id: cultureId },
        select: { id: true },
      });
      if (!parentExists) {
        throw new NotFoundException(
          this.apiResponse.error(
            `Không tìm thấy Culture Content với ID "${cultureId}".`,
          ),
        );
      }

      const sections = await this.prisma.content_section.findMany({
        where: { culture_id: cultureId },
        orderBy: {
          title: 'asc',
        },
      });
      return this.apiResponse.success(
        `Lấy danh sách Content Sections cho Culture Content ${cultureId} thành công`,
        sections,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding sections by culture content:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi khi lấy danh sách Content Sections.',
          error.message,
        ),
      );
    }
  }

  async remove(id: string): Promise<ApiResponseDto> {
    try {
      await this.prisma.content_section.delete({
        where: { id },
      });
      return this.apiResponse.success(
        `Xóa Content Section ID "${id}" thành công`,
      ); // Thường không cần trả về data
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Lỗi P2025: Record to delete not found.
        if (error.code === 'P2025') {
          throw new NotFoundException(
            this.apiResponse.error(
              `Không tìm thấy Content Section với ID "${id}" để xóa.`,
            ),
          );
        }
        console.error('Prisma Error:', error);
        throw new InternalServerErrorException(
          this.apiResponse.error(
            'Lỗi CSDL khi xóa Content Section.',
            error.message,
          ),
        );
      }
      console.error('Unexpected error removing content section:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi không mong muốn khi xóa Content Section.',
          error.message,
        ),
      );
    }
  }
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ secure_url: string; public_id: string }> {
    try {
      const uploadResult = await this.cloudinary.uploadImageFile(file);
      return uploadResult as { secure_url: string; public_id: string };
    } catch (err) {
      throw new Error(`Failed to upload image: ${err.message}`);
    }
  }
}
