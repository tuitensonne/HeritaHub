import { Global, Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ApiResponseModule } from 'src/api-response/api-response.module';

@Global()
@Module({
  imports: [ApiResponseModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
