import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform overview' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getRevenue(new Date(startDate), new Date(endDate));
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get growth analytics' })
  getGrowth() {
    return this.analyticsService.getGrowth();
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get retention analytics' })
  getRetention() {
    return this.analyticsService.getRetention();
  }
}
