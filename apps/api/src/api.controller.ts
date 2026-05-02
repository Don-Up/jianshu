import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiResponse, User } from '@jianshu/shared';
import { ApiTags, ApiOperation, ApiResponse as NestApiResponse } from '@nestjs/swagger';

@ApiTags('api')
@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @NestApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): ApiResponse<{ status: string }> {
    return this.apiService.getHealth();
  }

  @Get('user')
  @ApiOperation({ summary: 'Get demo user' })
  @NestApiResponse({ status: 200, description: 'Returns a demo user' })
  getUser(): ApiResponse<User> {
    return this.apiService.getUser();
  }
}
