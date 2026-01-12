import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@ApiTags('billing')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'plan', required: false, enum: SubscriptionPlan })
  getAllSubscriptions(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('status') status?: SubscriptionStatus,
    @Query('plan') plan?: SubscriptionPlan,
  ) {
    return this.billingService.getAllSubscriptions({ skip, take, status, plan });
  }

  @Get('subscriptions/:restaurantId')
  @ApiOperation({ summary: 'Get subscription for a restaurant' })
  getSubscription(@Param('restaurantId') restaurantId: string) {
    return this.billingService.getSubscription(restaurantId);
  }

  @Patch('subscriptions/:restaurantId/plan')
  @ApiOperation({ summary: 'Update subscription plan' })
  updatePlan(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: { plan: SubscriptionPlan },
  ) {
    return this.billingService.updatePlan(restaurantId, dto.plan);
  }

  @Post('subscriptions/:restaurantId/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancelSubscription(@Param('restaurantId') restaurantId: string) {
    return this.billingService.cancelSubscription(restaurantId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getAllPayments(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
  ) {
    return this.billingService.getAllPayments({ skip, take });
  }
}
