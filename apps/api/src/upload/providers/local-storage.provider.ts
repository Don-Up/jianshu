import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { StorageProvider, UploadResult } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly dest: string;

  constructor() {
    this.dest = process.env.UPLOAD_DEST || './uploads';
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const uploadDir = join(process.cwd(), this.dest);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, file.buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
