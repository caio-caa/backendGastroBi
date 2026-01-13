import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class PublicRestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List all public restaurants' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'cuisine', required: false, type: String })
  @ApiQuery({ name: 'isOpen', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findPublic(
    @Query('search') search?: string,
    @Query('cuisine') cuisine?: string,
    @Query('isOpen') isOpen?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.restaurantsService.findPublic({
      search,
      cuisine,
      isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
      page,
      limit,
    });
  }
}
