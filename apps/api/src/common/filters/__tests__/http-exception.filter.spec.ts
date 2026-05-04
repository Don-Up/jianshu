import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HttpExceptionFilter } from '../http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  const createMockHost = (exception: unknown) => ({
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  });

  describe('catch', () => {
    it('should return 500 for generic errors', () => {
      const exception = new Error('Something went wrong');
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: '服务器内部错误',
        statusCode: 500,
      });
    });

    it('should return proper status and message for HttpException with string response', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('should return proper status and message for HttpException with object response', () => {
      const exception = new HttpException({ message: 'Bad Request' }, HttpStatus.BAD_REQUEST);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('should handle array messages by joining with comma', () => {
      const exception = new HttpException({ message: ['Field1 is required', 'Field2 is invalid'] }, HttpStatus.BAD_REQUEST);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Field1 is required, Field2 is invalid',
        statusCode: 400,
      });
    });

    it('should default message for object response without message field', () => {
      const exception = new HttpException({ statusCode: 403 }, HttpStatus.FORBIDDEN);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: '服务器内部错误',
        statusCode: 403,
      });
    });

    it('should handle NotFoundException correctly', () => {
      const exception = new HttpException('User not found', HttpStatus.NOT_FOUND);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    });

    it('should handle ForbiddenException correctly', () => {
      const exception = new HttpException('Not authorized', HttpStatus.FORBIDDEN);
      const host = createMockHost(exception);

      filter.catch(exception, host as any);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized',
        statusCode: 403,
      });
    });
  });
});