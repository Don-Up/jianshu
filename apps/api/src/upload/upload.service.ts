import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { StorageProvider, UploadResult } from './providers/storage-provider.interface';

@Injectable()
export class UploadService {
  constructor(
    @Inject('STORAGE_PROVIDER') private storageProvider: StorageProvider,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageProvider.upload(file);
  }
}
