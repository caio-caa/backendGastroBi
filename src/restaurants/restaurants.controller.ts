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
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RestaurantStatus } from '@prisma/client';

@ApiTags('restaurants')
@Controller('admin/restaurants')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant (Admin only)' })
  create(
    @Body() dto: { name: string; slug: string; cnpj?: string; phone?: string; email?: string; ownerId?: string },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.restaurantsService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: RestaurantStatus })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('status') status?: RestaurantStatus,
  ) {
    return this.restaurantsService.findAll({ skip, take, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a restaurant' })
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; phone?: string; email?: string },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.restaurantsService.update(id, dto, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a restaurant' })
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.restaurantsService.remove(id, adminId);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a restaurant' })
  suspend(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.restaurantsService.suspend(id, adminId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a restaurant' })
  activate(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.restaurantsService.activate(id, adminId);
  }
}
