import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { MenuService } from './menu.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly menuService: MenuService,
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

  @Get(':slug/info')
  @Public()
  @ApiOperation({ summary: 'Get detailed restaurant info' })
  getRestaurantInfo(@Param('slug') slug: string) {
    return this.menuService.getRestaurantInfo(slug);
  }

  @Post(':slug/coupon/validate')
  @Public()
  @ApiOperation({ summary: 'Validate a coupon code' })
  validateCoupon(
    @Param('slug') slug: string,
    @Body() dto: { code: string; subtotal: number; customerId?: string },
  ) {
    return this.menuService.validateCoupon(slug, dto.code, dto.subtotal, dto.customerId);
  }

  @Post(':slug/delivery/calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate delivery fee' })
  calculateDelivery(
    @Param('slug') slug: string,
    @Body() dto: { zipCode: string },
  ) {
    return this.menuService.calculateDelivery(slug, dto.zipCode);
  }

  @Post(':slug/customer/auth/whatsapp')
  @Public()
  @ApiOperation({ summary: 'Start WhatsApp authentication' })
  startWhatsAppAuth(
    @Param('slug') slug: string,
    @Body() dto: { phone: string },
  ) {
    return this.menuService.startWhatsAppAuth(slug, dto.phone);
  }

  @Post(':slug/customer/auth/verify')
  @Public()
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(
    @Param('slug') slug: string,
    @Body() dto: { phone: string; code: string },
  ) {
    return this.menuService.verifyOtp(slug, dto.phone, dto.code);
  }

  @Get(':slug/customer/loyalty')
  @Public()
  @ApiOperation({ summary: 'Get customer loyalty info' })
  getCustomerLoyalty(
    @Param('slug') slug: string,
    @Body() dto: { customerId: string },
  ) {
    return this.menuService.getCustomerLoyalty(slug, dto.customerId);
  }
}
