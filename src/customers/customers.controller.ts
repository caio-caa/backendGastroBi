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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomerLevel, UserRole } from '@prisma/client';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new customer' })
  create(
    @Body() dto: { name: string; phone: string; email?: string; birthday?: string; tags?: string[] },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.customersService.create(
      { ...dto, birthday: dto.birthday ? new Date(dto.birthday) : undefined },
      restaurantId,
      userId,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'level', required: false, enum: CustomerLevel })
  findAll(
    @TenantId() restaurantId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('search') search?: string,
    @Query('level') level?: CustomerLevel,
  ) {
    return this.customersService.findAll(restaurantId, { skip, take, search, level });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a customer by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.customersService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a customer' })
  update(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { name?: string; phone?: string; email?: string; tags?: string[] },
    @CurrentUser('sub') userId: string,
  ) {
    return this.customersService.update(id, restaurantId, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  remove(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.customersService.remove(id, restaurantId, userId);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get customer orders' })
  getOrders(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.customersService.getOrders(id, restaurantId);
  }

  @Post(':id/points')
  @ApiOperation({ summary: 'Add points to customer' })
  addPoints(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { points: number; reason: string },
  ) {
    return this.customersService.addPoints(id, restaurantId, dto.points, dto.reason);
  }
}
