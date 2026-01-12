import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { OrdersService } from '../orders/orders.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get public menu for a restaurant' })
  getPublicMenu(@Param('slug') slug: string) {
    return this.productsService.getPublicMenu(slug);
  }

  @Get(':slug/product/:productId')
  @Public()
  @ApiOperation({ summary: 'Get a product from public menu' })
  getPublicProduct(
    @Param('slug') slug: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.getPublicProduct(slug, productId);
  }
}
