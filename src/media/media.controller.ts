import { Body, Controller, Delete, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file')) // field name 'file'
  async uploadFile(@UploadedFile() file: Express.Multer.File) {

      const uploadedFileUrl = await this.mediaService.uploadMedia(file);
      return { url: uploadedFileUrl };

  }

  @Delete('file')
  async deleteMedia(@Body('file_url') file_url: string) {
      const uploadedFileUrl = await this.mediaService.deleteMedia(file_url);
      console.log(uploadedFileUrl)
      return { url: uploadedFileUrl };

  }
}
