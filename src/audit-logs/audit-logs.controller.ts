import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AuditAction } from '@prisma/client';

@ApiTags('audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entity', required: false })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
  ) {
    return this.auditLogsService.findAll({
      skip,
      take,
      userId,
      action,
      entity,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  async getStats() {
    return this.auditLogsService.getStats();
  }
}
