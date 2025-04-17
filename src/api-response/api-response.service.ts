// src/common/response/api-response.service.ts
import { Global, Injectable } from '@nestjs/common';
import { ApiResponseDto } from './api-response.dto';

@Injectable()
export class ApiResponseService {
  success(message: string, data: any = null): ApiResponseDto {
    return {
      status: 'success',
      message,
      data,
    };
  }

  error(message: string, error: any = null): ApiResponseDto {
    return {
      status: 'error',
      message,
      error,
    };
  }
}
