import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { LocalStorageProvider } from '../providers/local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  const testUploadDirRelative = 'test-uploads';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: LocalStorageProvider,
          useFactory: () => {
            const p = new LocalStorageProvider();
            // Override dest with relative path for testing
            (p as any).dest = testUploadDirRelative;
            return p;
          },
        },
      ],
    }).compile();

    provider = module.get<LocalStorageProvider>(LocalStorageProvider);
  });

  afterEach(() => {
    // Clean up test files
    const testDir = join(process.cwd(), testUploadDirRelative);
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe('upload', () => {
    it('should upload file and return result with local url', async () => {
      const result = await provider.upload(mockFile);

      expect(result).toMatchObject({
        url: expect.stringContaining('/uploads/'),
        filename: expect.stringContaining('-test-image.jpg'),
        mimetype: 'image/jpeg',
        size: mockFile.size,
      });
    });

    it('should save file to disk', async () => {
      const result = await provider.upload(mockFile);
      const filepath = join(process.cwd(), testUploadDirRelative, result.filename);

      expect(existsSync(filepath)).toBe(true);
      const content = readFileSync(filepath);
      expect(content.toString()).toBe('fake image data');
    });

    it('should generate filename with timestamp prefix', async () => {
      const result = await provider.upload(mockFile);

      expect(result.filename).toMatch(/^\d+-+test-image\.jpg$/);
    });

    it('should create upload directory if not exists', async () => {
      const testDir = join(process.cwd(), testUploadDirRelative);
      rmSync(testDir, { recursive: true, force: true });

      expect(existsSync(testDir)).toBe(false);

      const result = await provider.upload(mockFile);

      expect(existsSync(testDir)).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('should preserve original mimetype', async () => {
      const pngFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'test.png',
        mimetype: 'image/png',
      };

      const result = await provider.upload(pngFile);

      expect(result.mimetype).toBe('image/png');
    });

    it('should handle webp format', async () => {
      const webpFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'test.webp',
        mimetype: 'image/webp',
      };

      const result = await provider.upload(webpFile);

      expect(result.mimetype).toBe('image/webp');
      expect(result.filename).toMatch(/^\d+-test\.webp$/);
    });
  });
});
