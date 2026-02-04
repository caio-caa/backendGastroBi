import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  constructor(private cloudinaryService: CloudinaryService) {}

  async uploadImage(file: UploadedFile, folder: string = 'misc'): Promise<{ url: string; publicId: string }> {
    return this.cloudinaryService.upload(file, folder);
  }

  async deleteImage(url: string): Promise<void> {
    const publicId = this.cloudinaryService.extractPublicId(url);
    if (publicId) {
      await this.cloudinaryService.delete(publicId);
    }
  }
}
