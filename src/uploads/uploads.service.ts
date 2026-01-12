import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadsService {
  async uploadImage(file: UploadedFile): Promise<{ url: string }> {
    // In production, this would upload to Cloudinary or similar
    // Generate a safe filename using hash instead of original name
    const fileHash = crypto.randomBytes(16).toString('hex');
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? extension : 'jpg';
    
    return {
      url: `https://via.placeholder.com/400?text=${fileHash}.${safeExtension}`,
    };
  }
}
