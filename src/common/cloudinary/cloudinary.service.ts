import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: UploadedFile, folder: string): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `gastrobi/${folder}`,
          resource_type: 'auto',
          quality: 'auto',
          format: 'webp',
          transformation: [
            { width: 1200, height: 1200, crop: 'fill', gravity: 'auto' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new BadRequestException('Upload failed: No result returned'));
          }
        },
      );

      stream.end(file.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    if (!publicId) {
      return; // Skip if no public ID
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Log but don't throw - deletion failure shouldn't break the application
      console.error(`Failed to delete Cloudinary file ${publicId}:`, error);
    }
  }

  extractPublicId(url: string): string | null {
    if (!url) return null;

    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/[cloud-name]/image/upload/[public-id]
    const match = url.match(/\/upload\/(.+?)(?:\.|$)/);
    return match ? match[1] : null;
  }
}
