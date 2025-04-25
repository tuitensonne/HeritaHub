// src/content_section/content_section.module.ts

import { Module } from '@nestjs/common';
import { ContentSectionService } from './content_section.service';
import { ContentSectionController } from './content_section.controller';
// Giả định PrismaModule và ApiResponseModule đã được cung cấp global trong AppModule
// Nếu không, bạn cần import chúng ở đây:
// import { PrismaModule } from '../prisma/prisma.module';
// import { ApiResponseModule } from '../api-response/api-response.module';

@Module({
  // imports: [PrismaModule, ApiResponseModule], // Chỉ cần nếu không phải global
  controllers: [ContentSectionController],
  providers: [ContentSectionService],
})
export class ContentSectionModule {}
