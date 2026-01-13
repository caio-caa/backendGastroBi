import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-by-category')
  @ApiOperation({ summary: 'Get sales report grouped by category' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  salesByCategory(
    @TenantId() restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesByCategory(
      restaurantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('customers-by-level')
  @ApiOperation({ summary: 'Get customers grouped by loyalty level' })
  customersByLevel(@TenantId() restaurantId: string) {
    return this.reportsService.getCustomersByLevel(restaurantId);
  }

  @Get('hourly-sales')
  @ApiOperation({ summary: 'Get sales report grouped by hour' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  hourlySales(
    @TenantId() restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getHourlySales(
      restaurantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  productPerformance(
    @TenantId() restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getProductPerformance(
      restaurantId,
      new Date(startDate),
      new Date(endDate),
      limit ? parseInt(String(limit), 10) : 20,
    );
  }

  @Post('export')
  @ApiOperation({ summary: 'Export report data' })
  @ApiQuery({ name: 'type', required: true, enum: ['sales', 'customers', 'products', 'orders'] })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'xlsx'] })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async exportReport(
    @TenantId() restaurantId: string,
    @Query('type') type: string,
    @Query('format') format: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.reportsService.exportReport(
      restaurantId,
      type,
      format,
      new Date(startDate),
      new Date(endDate),
    );

    const contentType =
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });

    return new StreamableFile(result.buffer);
  }
}
