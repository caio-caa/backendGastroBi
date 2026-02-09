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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  create(
    @Body() dto: { name: string; description?: string; image?: string },
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.categoriesService.create(dto, restaurantId, userId);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@TenantId() restaurantId: string) {
    return this.categoriesService.findAll(restaurantId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.WAITER)
  @ApiOperation({ summary: 'Get a category by ID' })
  findOne(@Param('id') id: string, @TenantId() restaurantId: string) {
    return this.categoriesService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @Body() dto: { name?: string; description?: string; isActive?: boolean },
    @CurrentUser('sub') userId: string,
  ) {
    return this.categoriesService.update(id, restaurantId, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a category' })
  remove(
    @Param('id') id: string,
    @TenantId() restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.categoriesService.remove(id, restaurantId, userId);
  }

  @Patch('reorder')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reorder categories' })
  reorder(
    @TenantId() restaurantId: string,
    @Body() dto: { categoryIds: string[] },
  ) {
    return this.categoriesService.reorder(restaurantId, dto.categoryIds);
  }
}
