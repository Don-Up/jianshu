import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, UploadResult } from './storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private logger = new Logger('CloudinaryStorageProvider');

  constructor() {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
    });
    this.logger.log('Cloudinary storage provider initialized');
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const folder = process.env.CLOUDINARY_FOLDER || 'jianshu/uploads';

      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.originalname}`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }
          resolve({
            url: result.secure_url,
            filename: result.public_id,
            mimetype: file.mimetype,
            size: file.size,
          });
        },
      ).end(file.buffer);
    });
  }
}
