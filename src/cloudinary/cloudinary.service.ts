import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const options: ConfigOptions = {
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    };
    cloudinary.config(options);
  }

  async uploadImageFile(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImageByUrl(url: string): Promise<any> {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      const uploadIndex = parts.findIndex((part) => part === 'upload');
      if (uploadIndex === -1 || parts.length <= uploadIndex + 1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      const publicIdParts = parts.slice(uploadIndex + 1);
      const withoutVersion = publicIdParts.filter(
        (part) => !/^v\d+$/.test(part),
      );

      const filename = withoutVersion.pop();
      const filenameWithoutExt = filename?.split('.')[0];

      const folderPath = withoutVersion.join('/');
      return await cloudinary.uploader.destroy(
        folderPath
          ? `${folderPath}/${filenameWithoutExt ?? ''}`
          : (filenameWithoutExt ?? ''),
      );
    } catch (err) {
      throw new Error(`Failed to extract public_id from URL: ${err.message}`);
    }
  }
}
