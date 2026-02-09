import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserType, UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() dto: CreateUserDto, @CurrentUser('sub') adminId: string) {
    return this.usersService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: UserType })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @Query('type') type?: UserType,
  ) {
    return this.usersService.findAll({ skip, take, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') adminId: string,
  ) {
    return this.usersService.update(id, dto, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.usersService.remove(id, adminId);
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  ban(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.usersService.ban(id, adminId);
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  unban(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.usersService.unban(id, adminId);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  resetPassword(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.usersService.resetPassword(id, adminId);
  }

  @Put('current-restaurant/:restaurantId')
  @ApiOperation({ summary: 'Switch to a different restaurant' })
  switchRestaurant(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.switchRestaurant(userId, restaurantId);
  }

  @Post('waiter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a waiter (Owner/Manager only)' })
  createWaiter(
    @Body() dto: CreateWaiterDto,
    @CurrentUser('sub') restaurantOwnerId: string,
  ) {
    return this.usersService.createWaiter(dto, restaurantOwnerId);
  }
}
