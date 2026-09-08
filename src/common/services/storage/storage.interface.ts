export interface UploadResult {
  fileUrl: string;
  publicId: string; // Unique file key/ID in S3 or Cloudinary
  fileName: string;
  mimeType: string;
  size: number;
}

export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<void>;
}
