import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  getSettings(@TenantId() restaurantId: string) {
    return this.settingsService.getSettings(restaurantId);
  }

  @Patch('restaurant')
  @ApiOperation({ summary: 'Update restaurant info' })
  updateRestaurant(
    @TenantId() restaurantId: string,
    @Body() dto: {
      name?: string;
      cnpj?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
      email?: string;
      website?: string;
      description?: string;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.settingsService.updateRestaurant(restaurantId, dto, userId);
  }

  @Patch('opening-hours')
  @ApiOperation({ summary: 'Update opening hours' })
  updateOpeningHours(
    @TenantId() restaurantId: string,
    @Body() dto: Record<string, { open: string; close: string; closed: boolean }>,
  ) {
    return this.settingsService.updateOpeningHours(restaurantId, dto);
  }

  @Patch('social-media')
  @ApiOperation({ summary: 'Update social media' })
  updateSocialMedia(
    @TenantId() restaurantId: string,
    @Body() dto: {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
      tiktok?: string;
    },
  ) {
    return this.settingsService.updateSocialMedia(restaurantId, dto);
  }

  @Patch('loyalty')
  @ApiOperation({ summary: 'Update loyalty settings' })
  updateLoyalty(
    @TenantId() restaurantId: string,
    @Body() dto: {
      enabled?: boolean;
      pointsPerReal?: number;
      bronzeThreshold?: number;
      silverThreshold?: number;
      goldThreshold?: number;
      platinumThreshold?: number;
      pointsExpiration?: number;
      welcomeBonus?: number;
      birthdayBonus?: number;
      referralBonus?: number;
    },
  ) {
    return this.settingsService.updateLoyalty(restaurantId, dto);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification settings' })
  updateNotifications(
    @TenantId() restaurantId: string,
    @Body() dto: {
      newCustomer?: boolean;
      campaignResults?: boolean;
      lowStock?: boolean;
      dailyReport?: boolean;
      orderReceived?: boolean;
      paymentReceived?: boolean;
      systemUpdates?: boolean;
    },
  ) {
    return this.settingsService.updateNotifications(restaurantId, dto);
  }
}
