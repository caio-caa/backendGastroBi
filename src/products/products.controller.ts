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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, Prisma } from '@prisma/client';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @Body() dto: {
      name: string;
      description?: string;
      price: number;
      cost?: number;
      categoryId: string;
      image?: string;
      variations?: Prisma.InputJsonValue;
      extras?: Prisma.InputJsonValue;
      allergens?: string[];
      preparationTime?: number;
      tags?: string[];
    },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productsService.create(dto, restaurantId, userId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get all products' })
  findAll(
    @TenantId() restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.productsService.findAll(restaurantId, {
      categoryId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.productsService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: {
      name?: string;
      description?: string;
      price?: number;
      isActive?: boolean;
      isAvailable?: boolean;
    },
    @CurrentUser('sub') userId: string,
  ) {
    return this.productsService.update(id, restaurantId, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a product' })
  remove(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.productsService.remove(id, restaurantId, userId);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Toggle product availability' })
  toggle(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.productsService.toggle(id, restaurantId);
  }

  @Patch('reorder')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reorder products in a category' })
  reorder(
    @TenantId() restaurantId: string,
    @Body() dto: { categoryId: string; productIds: string[] },
  ) {
    return this.productsService.reorder(restaurantId, dto.categoryId, dto.productIds);
  }
}
