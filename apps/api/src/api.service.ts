import { Injectable } from '@nestjs/common';
import { ApiResponse, User } from '@jianshu/shared';

@Injectable()
export class ApiService {
  getHealth(): ApiResponse<{ status: string }> {
    return {
      success: true,
      data: { status: 'ok' },
    };
  }

  getUser(): ApiResponse<User> {
    const user: User = {
      id: '1',
      email: 'user@example.com',
      name: 'Demo User',
      createdAt: new Date(),
    };
    return {
      success: true,
      data: user,
    };
  }
}
