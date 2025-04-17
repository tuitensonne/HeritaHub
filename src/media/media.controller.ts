import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // field name 'file'
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const uploadedFileUrl = await this.mediaService.uploadMedia(file);
    return { url: uploadedFileUrl };
  }
}
