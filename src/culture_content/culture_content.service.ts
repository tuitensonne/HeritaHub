import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Đường dẫn đến PrismaService của bạn
import { Culture_content } from '@prisma/client';
import { CreateCultureContentDto } from './dto/culture_content.dto';
@Injectable()
export class CultureContentService {
  // Inject PrismaService để tương tác với DB
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo mới một Culture Content trong cơ sở dữ liệu.
   * @param createCultureContentDto Dữ liệu đầu vào từ client đã được validate.
   * @returns Promise chứa Culture_content mới được tạo.
   * @throws Lỗi Prisma nếu có vấn đề về CSDL (ví dụ: unique constraint).
   */
  async create(
    createCultureContentDto: CreateCultureContentDto,
  ): Promise<Culture_content> {
    // eslint-disable-next-line no-useless-catch
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const newContent = await this.prisma.culture_content.create({
        data: {
          title: createCultureContentDto.title,
          description: createCultureContentDto.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          category: createCultureContentDto.category,
        },
      });
      return newContent;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<Culture_content> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const content = await this.prisma.culture_content.findUnique({
      where: { id: id },
    });

    if (!content) {
      throw new NotFoundException(
        `Không tìm thấy Culture Content với ID "${id}"`,
      );
    }
    return content;
  }
}
