import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TableStatus, UserRole } from '@prisma/client';

@ApiTags('tables')
@Controller('tables')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new table' })
  create(
    @Body() dto: { number: string; capacity?: number },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tablesService.create(dto, restaurantId, userId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get all tables' })
  findAll(@TenantId() restaurantId: string) {
    return this.tablesService.findAll(restaurantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get a table by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.tablesService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a table' })
  update(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { number?: string; capacity?: number },
    @CurrentUser('sub') userId: string,
  ) {
    return this.tablesService.update(id, restaurantId, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a table' })
  remove(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tablesService.remove(id, restaurantId, userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Update table status' })
  updateStatus(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { status: TableStatus },
  ) {
    return this.tablesService.updateStatus(id, restaurantId, dto.status);
  }

  @Post(':id/qr-code')
  @ApiOperation({ summary: 'Generate QR code for table' })
  generateQRCode(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { baseUrl: string },
  ) {
    return this.tablesService.generateQRCode(id, restaurantId, dto.baseUrl);
  }
}
