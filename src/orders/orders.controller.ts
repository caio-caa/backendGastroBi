import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Public } from '../common/decorators/public.decorator';
import { OrderType, OrderStatus, Prisma } from '@prisma/client';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiHeader({ name: 'x-idempotency-key', required: false })
  create(
    @Body() dto: {
      type: OrderType;
      customerId?: string;
      tableId?: string;
      items: Array<{
        productId: string;
        quantity: number;
        observations?: string;
      }>;
      notes?: string;
    },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.create(dto, restaurantId, userId, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: OrderType })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  findAll(
    @TenantId() restaurantId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('type') type?: OrderType,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(restaurantId, { skip, take, type, status });
  }

  @Get('kitchen')
  @ApiOperation({ summary: 'Get kitchen orders' })
  getKitchenOrders(@TenantId() restaurantId: string) {
    return this.ordersService.getKitchenOrders(restaurantId);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get order reports' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getReports(
    @TenantId() restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.ordersService.getReports(
      restaurantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.ordersService.findOne(id, restaurantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { status: OrderStatus },
    @CurrentUser('sub') userId: string,
  ) {
    return this.ordersService.updateStatus(id, restaurantId, dto.status, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ordersService.cancel(id, restaurantId, userId);
  }
}

@ApiTags('menu')
@Controller('menu/:slug/order')
export class PublicOrderController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a public order' })
  createPublicOrder(
    @Param('slug') slug: string,
    @Body() dto: {
      type: OrderType;
      tableNumber?: string;
      items: Array<{
        productId: string;
        quantity: number;
        observations?: string;
        extras?: Prisma.InputJsonValue;
        variation?: Prisma.InputJsonValue;
      }>;
      customer?: {
        name: string;
        phone: string;
        address?: Prisma.InputJsonValue;
      };
    },
  ) {
    return this.ordersService.createPublicOrder(slug, dto);
  }
}
