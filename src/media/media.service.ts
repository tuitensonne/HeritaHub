import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class MediaService {
  constructor(private readonly cloudinary: CloudinaryService) {}  
  async uploadMedia(file: Express.Multer.File) {
    return await this.cloudinary.uploadImageFile(file)
  }

  async deleteMedia(file_url: string) {
    return await this.cloudinary.deleteImageByUrl(file_url)
  }
}
