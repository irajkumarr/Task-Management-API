import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { IStorageService, UploadResult } from './storage.interface';
import streamifier from 'streamifier';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // Determine resource type: images/videos vs raw documents (PDF, zip, docx, etc.)
      const isImageOrVideo =
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/');

      const uploadOptions: UploadApiOptions = {
        folder: `task-manager/${folder}`,
        resource_type: isImageOrVideo ? 'auto' : 'raw',
        use_filename: true,
        unique_filename: true,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException(
                error.message || 'Cloudinary upload failed',
              ),
            );
          }
          if (!result) {
            return reject(
              new BadRequestException('No upload result from Cloudinary'),
            );
          }

          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileName: `${result.public_id}.${result.format || file.originalname.split('.').pop() || 'bin'}`,
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
