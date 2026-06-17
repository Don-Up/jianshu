export interface UploadResult {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<UploadResult>;
  delete?(url: string): Promise<void>;
}
