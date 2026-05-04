import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from '../transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockContext = {} as ExecutionContext;
    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  describe('intercept', () => {
    it('should wrap object response in success format', (done) => {
      const responseData = { id: '1', name: 'test' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: responseData,
        });
        done();
      });
    });

    it('should not wrap if response already has success property', (done) => {
      const wrappedResponse = { success: true, data: { id: '1' } };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(wrappedResponse));

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toBe(wrappedResponse);
        done();
      });
    });

    it('should handle null response', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: null,
        });
        done();
      });
    });

    it('should handle array response', (done) => {
      const arrayData = [{ id: '1' }, { id: '2' }];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(arrayData));

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: arrayData,
        });
        done();
      });
    });

    it('should handle string response', (done) => {
      const stringData = 'plain string';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringData));

      interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: stringData,
        });
        done();
      });
    });
  });
});