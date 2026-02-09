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
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LoyaltyRuleType, LoyaltyRewardType, UserRole } from '@prisma/client';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // Rules
  @Post('rules')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a loyalty rule' })
  createRule(
    @Body() dto: { name: string; type: LoyaltyRuleType; points: number; description?: string },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.createRule(dto, restaurantId, userId);
  }

  @Get('rules')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all loyalty rules' })
  findAllRules(@TenantId() restaurantId: string) {
    return this.loyaltyService.findAllRules(restaurantId);
  }

  @Patch('rules/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
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
  @Roles(UserRole.OWNER, UserRole.MANAGER)
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
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a loyalty reward' })
  createReward(
    @Body() dto: { name: string; pointsCost: number; type: LoyaltyRewardType; value?: number; description?: string },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.loyaltyService.createReward(dto, restaurantId, userId);
  }

  @Get('rewards')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all loyalty rewards' })
  findAllRewards(@TenantId() restaurantId: string) {
    return this.loyaltyService.findAllRewards(restaurantId);
  }

  @Patch('rewards/:id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
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
  @Roles(UserRole.OWNER, UserRole.MANAGER)
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
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Redeem a reward' })
  redeem(
    @Body() dto: { customerId: string; rewardId: string },
    @TenantId() restaurantId: string,
  ) {
    return this.loyaltyService.redeem(dto, restaurantId);
  }

  @Get('history/:customerId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get customer loyalty history' })
  getHistory(
    @Param('customerId') customerId: string,
    @TenantId() restaurantId: string,
  ) {
    return this.loyaltyService.getHistory(customerId, restaurantId);
  }
}
