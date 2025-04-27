import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ensure path is correct
import { ApiResponseService } from '../api-response/api-response.service'; // Ensure path is correct
import { ApiResponseDto } from '../api-response/api-response.dto'; // Ensure path is correct
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { Readable } from 'stream';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
// Removed: cuid import if not used elsewhere

@Injectable()
export class CultureContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiResponse: ApiResponseService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  // async create(
  //   createCultureContentDto: CreateCultureContentDto,
  // ): Promise<ApiResponseDto> {
  //   // Removed destructuring of contentSections
  //   // const { contentSections, ...mainData } = createCultureContentDto;

  //   try {
  //     // Removed transaction as it's no longer needed for this simplified operation
  //     const createdCultureContent = await this.prisma.culture_content.create({
  //       data: {
  //         title: createCultureContentDto.title,
  //         description: createCultureContentDto.description,
  //         category: createCultureContentDto.category,
  //         // Không còn tạo contentSections ở đây nữa
  //       },
  //     });

  //     return this.apiResponse.success(
  //       'Tạo Culture Content thành công',
  //       createdCultureContent, // Chỉ trả về Culture Content chính
  //     );
  //   } catch (error) {
  //     if (error instanceof PrismaClientKnownRequestError) {
  //       if (error.code === 'P2002') {
  //         const target =
  //           (error.meta?.target as string[])?.join(', ') || 'trường nào đó';
  //         throw new ConflictException(
  //           this.apiResponse.error(`Giá trị cho ${target} đã tồn tại.`),
  //         );
  //       }
  //       console.error('Prisma Error:', error);
  //       throw new InternalServerErrorException(
  //         this.apiResponse.error(
  //           'Lỗi CSDL khi tạo Culture Content.',
  //           error.message,
  //         ),
  //       );
  //     }

  //     console.error('Unexpected Error:', error);
  //     throw new InternalServerErrorException(
  //       this.apiResponse.error(
  //         'Đã xảy ra lỗi không mong muốn khi tạo Culture Content.',
  //         error.message,
  //       ),
  //     );
  //   }
  // }

  async findOne(id: string): Promise<ApiResponseDto> {
    try {

      const cultureContent = await this.prisma.culture_content.findUnique({
        where: {
          location_id: id,
        },
        include: {
          Content_section: {
            include: {
              Media: true,
            },
          },
        },
      });

      if (!cultureContent) {
        throw new NotFoundException(
          this.apiResponse.error(
            `Không tìm thấy Culture Content với ID "${id}"`,
          ),
        );
      }
      return this.apiResponse.success(
        'Lấy thông tin Culture Content thành công',
        cultureContent,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      if (error instanceof PrismaClientValidationError) {
        throw new BadRequestException(
          this.apiResponse.error(
            'ID không hợp lệ hoặc lỗi truy vấn.',
            error.message,
          ),
        );
      }

      console.error('Error finding Culture Content by ID:', error);
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
          Content_section: true, // Giữ lại include nếu bạn vẫn muốn lấy các section liên quan
        },
        orderBy: {
          created_at: 'desc', // Optional: Sort by creation date if desired for the main list
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

  // --- Mới: Service để lấy Culture Content mới nhất ---
  async findLatest(): Promise<ApiResponseDto> {
    try {
      const latestContent = await this.prisma.culture_content.findFirst({
        orderBy: {
          created_at: 'desc', // Sắp xếp theo trường createdAt giảm dần
        },
        include: {
          Content_section: true, // Bao gồm cả các content sections liên quan
        },
      });

      if (!latestContent) {
        throw new NotFoundException(
          this.apiResponse.error(
            'Không tìm thấy Culture Content nào trong hệ thống.',
          ),
        );
      }

      return this.apiResponse.success(
        'Lấy Culture Content mới nhất thành công',
        latestContent,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding latest Culture Content:', error);
      throw new InternalServerErrorException(
        this.apiResponse.error(
          'Lỗi khi lấy Culture Content mới nhất.',
          error.message,
        ),
      );
    }
  }
  async getCultureContentByImage(file: Express.Multer.File) {
    try {
      const IMAGE_SEARCH = this.configService.get<string>('IMAGE_SEARCH');
      
      // Kiểm tra URL
      if (!IMAGE_SEARCH) {
        throw new Error('IMAGE_SEARCH URL is not configured');
      }
      
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
  
      const response = await lastValueFrom(
        this.httpService.post(
          IMAGE_SEARCH,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
      );
      const result = response.data;
  
      return this.apiResponse.success('Image search successfully', result);
    } catch (error) {
      console.error('Error details:', error.response?.status, error.response?.data || error.message);
      throw new InternalServerErrorException(
        this.apiResponse.error('Error in image search', error) 
      );
    }
  }
}
