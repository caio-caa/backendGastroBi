import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MenuController } from './menu.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [ProductsController, MenuController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
