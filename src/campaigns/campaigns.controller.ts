import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CampaignType, CampaignStatus, UserRole } from '@prisma/client';

@ApiTags('campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new campaign' })
  create(
    @Body() dto: { name: string; type: CampaignType; message: string; segmentation?: unknown },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.campaignsService.create(dto, restaurantId, userId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CampaignStatus })
  @ApiQuery({ name: 'type', required: false, enum: CampaignType })
  findAll(
    @TenantId() restaurantId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('status') status?: CampaignStatus,
    @Query('type') type?: CampaignType,
  ) {
    return this.campaignsService.findAll(restaurantId, { skip, take, status, type });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a campaign by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.campaignsService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a campaign' })
  update(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { name?: string; message?: string; status?: CampaignStatus },
    @CurrentUser('sub') userId: string,
  ) {
    return this.campaignsService.update(id, restaurantId, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.campaignsService.remove(id, restaurantId, userId);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule a campaign' })
  schedule(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { scheduledFor: string },
  ) {
    return this.campaignsService.schedule(id, restaurantId, new Date(dto.scheduledFor));
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign' })
  pause(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.campaignsService.pause(id, restaurantId);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get campaign metrics' })
  getMetrics(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.campaignsService.getMetrics(id, restaurantId);
  }
}
