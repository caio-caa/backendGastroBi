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
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { LoyaltyRuleType, LoyaltyRewardType } from '@prisma/client';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // Rules
  @Post('rules')
  @ApiOperation({ summary: 'Create a loyalty rule' })
  createRule(
    @Body() dto: { name: string; type: LoyaltyRuleType; points: number; description?: string },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.createRule(dto, restaurantId, userId);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all loyalty rules' })
  findAllRules(@TenantId() restaurantId: string) {
    return this.loyaltyService.findAllRules(restaurantId);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update a loyalty rule' })
  updateRule(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { name?: string; points?: number; isActive?: boolean },
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.updateRule(id, restaurantId, dto, userId);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete a loyalty rule' })
  deleteRule(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.deleteRule(id, restaurantId, userId);
  }

  // Rewards
  @Post('rewards')
  @ApiOperation({ summary: 'Create a loyalty reward' })
  createReward(
    @Body() dto: { name: string; pointsCost: number; type: LoyaltyRewardType; value?: number; description?: string },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.createReward(dto, restaurantId, userId);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get all loyalty rewards' })
  findAllRewards(@TenantId() restaurantId: string) {
    return this.loyaltyService.findAllRewards(restaurantId);
  }

  @Patch('rewards/:id')
  @ApiOperation({ summary: 'Update a loyalty reward' })
  updateReward(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { name?: string; pointsCost?: number; isActive?: boolean },
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.updateReward(id, restaurantId, dto, userId);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Delete a loyalty reward' })
  deleteReward(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.deleteReward(id, restaurantId, userId);
  }

  // Redemption
  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a reward' })
  redeem(
    @Body() dto: { customerId: string; rewardId: string },
    @TenantId() restaurantId: string,
  ) {
    return this.loyaltyService.redeem(dto, restaurantId);
  }

  @Get('history/:customerId')
  @ApiOperation({ summary: 'Get customer loyalty history' })
  getHistory(
    @Param('customerId') customerId: string,
    @TenantId() restaurantId: string,
  ) {
    return this.loyaltyService.getHistory(customerId, restaurantId);
  }
}
