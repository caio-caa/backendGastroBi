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
import { WhiteLabelService } from './white-label.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('white-label')
@Controller('admin/white-label')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  @Post()
  @ApiOperation({ summary: 'Create a white label config' })
  create(
    @Body() dto: {
      clientName: string;
      brandName: string;
      domain: string;
      primaryColor?: string;
      secondaryColor?: string;
    },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.whiteLabelService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all white label configs' })
  findAll() {
    return this.whiteLabelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a white label config by ID' })
  findOne(@Param('id') id: string) {
    return this.whiteLabelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a white label config' })
  update(
    @Param('id') id: string,
    @Body() dto: { brandName?: string; primaryColor?: string; customCSS?: string },
    @CurrentUser('sub') adminId: string,
  ) {
    return this.whiteLabelService.update(id, dto, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a white label config' })
  remove(@Param('id') id: string, @CurrentUser('sub') adminId: string) {
    return this.whiteLabelService.remove(id, adminId);
  }
}
