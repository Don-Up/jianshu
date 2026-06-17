import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    LocalStorageProvider,
    CloudinaryStorageProvider,
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: () =>
        process.env.CLOUDINARY_URL
          ? new CloudinaryStorageProvider()
          : new LocalStorageProvider(),
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
