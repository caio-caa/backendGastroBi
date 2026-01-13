import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List alerts' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: ['warning', 'info', 'success', 'error'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @TenantId() restaurantId: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.alertsService.findAll(restaurantId, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type,
      limit,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  markAsRead(
    @TenantId() restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.alertsService.markAsRead(restaurantId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  markAllAsRead(@TenantId() restaurantId: string) {
    return this.alertsService.markAllAsRead(restaurantId);
  }
}
