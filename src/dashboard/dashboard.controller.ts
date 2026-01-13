import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'year'] })
  getMetrics(
    @TenantId() restaurantId: string,
    @Query('period') period: string = 'today',
  ) {
    return this.dashboardService.getMetrics(restaurantId, period);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly data for charts' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'months', required: false, type: Number })
  getMonthlyData(
    @TenantId() restaurantId: string,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.dashboardService.getMonthlyData(restaurantId, year, months);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  getTopProducts(
    @TenantId() restaurantId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('period') period: string = 'month',
  ) {
    return this.dashboardService.getTopProducts(restaurantId, limit, period);
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentOrders(
    @TenantId() restaurantId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getRecentOrders(restaurantId, limit);
  }
}
