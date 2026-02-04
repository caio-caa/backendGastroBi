import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';

@Module({
  imports: [AuditLogsModule, CloudinaryModule],
  controllers: [ProductsController, MenuController],
  providers: [ProductsService, MenuService],
  exports: [ProductsService, MenuService],
})
export class ProductsModule {}
