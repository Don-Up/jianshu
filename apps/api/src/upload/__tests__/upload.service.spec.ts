import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from '../upload.service';
import { StorageProvider, UploadResult } from '../providers/storage-provider.interface';

describe('UploadService', () => {
  let uploadService: UploadService;
  let mockStorageProvider: jest.Mocked<StorageProvider>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100,
    buffer: Buffer.from('fake image data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const mockUploadResult: UploadResult = {
    url: '/uploads/1234567890-test-image.jpg',
    filename: '1234567890-test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 100,
  };

  beforeEach(async () => {
    mockStorageProvider = {
      upload: jest.fn().mockResolvedValue(mockUploadResult),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: 'STORAGE_PROVIDER',
          useValue: mockStorageProvider,
        },
      ],
    }).compile();

    uploadService = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const result = await uploadService.uploadFile(mockFile);

      expect(result).toEqual(mockUploadResult);
      expect(mockStorageProvider.upload).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(uploadService.uploadFile(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(uploadService.uploadFile(undefined as any)).rejects.toThrow(
        'No file uploaded',
      );
    });

    it('should throw BadRequestException when file is null', async () => {
      await expect(uploadService.uploadFile(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass file to storage provider', async () => {
      await uploadService.uploadFile(mockFile);

      expect(mockStorageProvider.upload).toHaveBeenCalledTimes(1);
      expect(mockStorageProvider.upload).toHaveBeenCalledWith(mockFile);
    });

    it('should return upload result from storage provider', async () => {
      const customResult: UploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
        filename: 'test',
        mimetype: 'image/jpeg',
        size: 2048,
      };
      mockStorageProvider.upload.mockResolvedValue(customResult);

      const result = await uploadService.uploadFile(mockFile);

      expect(result).toEqual(customResult);
      expect(result.url).toBe('https://res.cloudinary.com/test/image/upload/v123/test.jpg');
      expect(result.size).toBe(2048);
    });
  });
});
