import { Module } from '@nestjs/common';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelController } from './white-label.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';

@Module({
  imports: [AuditLogsModule, CloudinaryModule],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
