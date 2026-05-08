import { LoggingMiddleware } from '../logging.middleware';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  describe('use', () => {
    it('should call next function', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/articles',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      };
      const mockRes = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('100'),
        on: jest.fn(),
      };
      const mockNext = jest.fn();

      middleware.use(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should register finish event listener on response', () => {
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/articles',
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Chrome/100'),
      };
      const mockRes = {
        statusCode: 201,
        get: jest.fn().mockReturnValue('50'),
        on: jest.fn(),
      };
      const mockNext = jest.fn();

      middleware.use(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should extract correct data from request', () => {
      const mockReq = {
        method: 'DELETE',
        originalUrl: '/api/articles/test-slug',
        ip: '10.0.0.1',
        get: jest.fn().mockReturnValue('curl/7.68.0'),
      };
      const mockRes = {
        statusCode: 204,
        get: jest.fn().mockReturnValue('0'),
        on: jest.fn(),
      };
      const mockNext = jest.fn();

      middleware.use(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.method).toBe('DELETE');
      expect(mockReq.originalUrl).toBe('/api/articles/test-slug');
      expect(mockReq.ip).toBe('10.0.0.1');
      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
    });

    it('should extract correct data from response on finish event', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/nonexistent',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Chrome/100'),
      };
      let finishCallback: () => void;
      const mockRes = {
        statusCode: 404,
        get: jest.fn().mockReturnValue('0'),
        on: jest.fn().mockImplementation((event: string, callback: () => void) => {
          if (event === 'finish') {
            finishCallback = callback;
          }
        }),
      };
      const mockNext = jest.fn();

      middleware.use(mockReq as any, mockRes as any, mockNext);

      // Trigger the finish callback
      finishCallback!();

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.get).toHaveBeenCalledWith('content-length');
    });

    it('should handle null user-agent', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/health',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue(null),
      };
      const mockRes = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('0'),
        on: jest.fn(),
      };
      const mockNext = jest.fn();

      middleware.use(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});