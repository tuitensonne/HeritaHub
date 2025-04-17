import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from './media/media.module';
import { ApiResponseService } from './api-response/api-response.service';
import { Neo4jModule } from './neo4j/neo4j.module';
import { ApiResponseModule } from './api-response/api-response.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    PrismaModule, 
    EmailModule, 
    AuthModule, 
    CloudinaryModule, MediaModule, Neo4jModule, ApiResponseModule, UserModule
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}
