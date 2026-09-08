import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { IStorageService, UploadResult } from './storage.interface';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `task-manager/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileName: `${result.public_id}.${result.format || 'bin'}`,
            mimeType: file.mimetype,
            size: file.size,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
