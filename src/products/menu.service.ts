import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurantInfo(slug: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        address: true,
        openingHours: true,
        settings: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const settings = restaurant.settings as Record<string, unknown> || {};
    const openingHours = restaurant.openingHours as Array<{
      dayOfWeek: number;
      openTime: string | null;
      closeTime: string | null;
      isOpen: boolean;
    }> || [];

    // Check if restaurant is currently open
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todayHours = openingHours.find(h => h.dayOfWeek === dayOfWeek);
    let isOpen = false;
    
    if (todayHours?.isOpen && todayHours.openTime && todayHours.closeTime) {
      isOpen = currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
    }

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      logo: settings.logo || null,
      cover: settings.cover || null,
      description: settings.description || null,
      phone: restaurant.phone,
      address: restaurant.address,
      openingHours,
      isOpen,
      rating: settings.rating || 0,
      reviewsCount: settings.reviewsCount || 0,
      minimumOrderValue: settings.minimumOrderValue || 0,
      deliveryTime: settings.deliveryTime || { min: 30, max: 60 },
      whiteLabel: {
        primaryColor: settings.primaryColor || '#22C55E',
        secondaryColor: settings.secondaryColor || '#166534',
      },
    };
  }

  async validateCoupon(
    slug: string,
    code: string,
    subtotal: number,
    customerId?: string,
  ) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        restaurantId: restaurant.id,
        code: normalizedCode,
        isActive: true,
        deletedAt: null,
      },
      include: {
        usages: customerId ? {
          where: { customerId },
        } : false,
      },
    });

    // Coupon not found
    if (!coupon) {
      return {
        valid: false,
        code: normalizedCode,
        discountType: null,
        discountValue: 0,
        calculatedDiscount: 0,
        message: 'Cupom inválido ou expirado',
      };
    }

    // Check expiration
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return {
        valid: false,
        code: normalizedCode,
        discountType: null,
        discountValue: 0,
        calculatedDiscount: 0,
        message: 'Cupom expirado',
      };
    }

    // Check if not started yet
    if (coupon.startsAt && new Date() < coupon.startsAt) {
      return {
        valid: false,
        code: normalizedCode,
        discountType: null,
        discountValue: 0,
        calculatedDiscount: 0,
        message: 'Cupom ainda não está ativo',
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        code: normalizedCode,
        discountType: null,
        discountValue: 0,
        calculatedDiscount: 0,
        message: 'Cupom esgotado',
      };
    }

    // Check per customer limit
    if (customerId && coupon.perCustomerLimit) {
      const customerUsages = Array.isArray(coupon.usages) ? coupon.usages.length : 0;
      if (customerUsages >= coupon.perCustomerLimit) {
        return {
          valid: false,
          code: normalizedCode,
          discountType: null,
          discountValue: 0,
          calculatedDiscount: 0,
          message: 'Você já usou este cupom o número máximo de vezes',
        };
      }
    }

    // Check first purchase requirement
    if (coupon.isFirstPurchase && customerId) {
      const hasOrders = await this.prisma.order.findFirst({
        where: {
          customerId,
          restaurantId: restaurant.id,
          status: 'COMPLETED',
        },
      });
      if (hasOrders) {
        return {
          valid: false,
          code: normalizedCode,
          discountType: null,
          discountValue: 0,
          calculatedDiscount: 0,
          message: 'Cupom válido apenas para primeira compra',
        };
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        code: normalizedCode,
        discountType: null,
        discountValue: 0,
        calculatedDiscount: 0,
        minOrderValue: coupon.minOrderValue,
        message: `Valor mínimo do pedido: R$ ${coupon.minOrderValue.toFixed(2)}`,
      };
    }

    // Calculate discount
    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (subtotal * coupon.discountValue) / 100;
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    // Apply max discount cap
    if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
      calculatedDiscount = coupon.maxDiscount;
    }

    // Don't exceed subtotal
    if (calculatedDiscount > subtotal) {
      calculatedDiscount = subtotal;
    }

    return {
      valid: true,
      code: normalizedCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount,
      expiresAt: coupon.expiresAt?.toISOString() || null,
      message: 'Cupom aplicado com sucesso!',
    };
  }

  async calculateDelivery(slug: string, zipCode: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Normalize zip code (remove non-digits)
    const normalizedZip = zipCode.replace(/\D/g, '');

    if (normalizedZip.length !== 8) {
      throw new BadRequestException('CEP inválido. Use 8 dígitos.');
    }

    // Find matching delivery zone
    const zone = await this.prisma.deliveryZone.findFirst({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
        deletedAt: null,
        zipCodeStart: { lte: normalizedZip },
        zipCodeEnd: { gte: normalizedZip },
      },
    });

    if (!zone) {
      return {
        available: false,
        fee: 0,
        estimatedTime: 0,
        freeDeliveryMinimum: null,
        message: 'Infelizmente não entregamos nessa região',
      };
    }

    return {
      available: true,
      fee: zone.fee,
      estimatedTime: zone.estimatedTime,
      freeDeliveryMinimum: zone.freeMinimum,
      message: null,
    };
  }

  async startWhatsAppAuth(slug: string, phone: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '');

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete old OTPs for this phone
    await this.prisma.customerOtp.deleteMany({
      where: { phone: normalizedPhone },
    });

    // Create new OTP (expires in 5 minutes)
    await this.prisma.customerOtp.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // TODO: Integrate with WhatsApp Business API to send the code
    // For now, just log it (in production, send via WhatsApp)
    console.log(`[OTP] Phone: ${normalizedPhone}, Code: ${code}`);

    return {
      success: true,
      message: 'Código enviado para seu WhatsApp',
      expiresIn: 300,
    };
  }

  async verifyOtp(slug: string, phone: string, code: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    const otp = await this.prisma.customerOtp.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    // Mark OTP as verified
    await this.prisma.customerOtp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Find or create customer
    let customer = await this.prisma.customer.findFirst({
      where: {
        restaurantId: restaurant.id,
        phone: normalizedPhone,
        deletedAt: null,
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          restaurantId: restaurant.id,
          phone: normalizedPhone,
          name: 'Cliente',
        },
      });
    }

    // Count orders
    const orderCount = await this.prisma.order.count({
      where: {
        customerId: customer.id,
        status: 'COMPLETED',
      },
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        points: customer.points,
        level: customer.level.toLowerCase(),
        orders: orderCount,
      },
      token: null, // Optional: generate JWT token for customer
    };
  }

  async getCustomerLoyalty(slug: string, customerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        restaurantId: restaurant.id,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Get loyalty settings
    const settings = await this.prisma.restaurantSettings.findFirst({
      where: { restaurantId: restaurant.id },
    });

    // Calculate next level
    const levels = [
      { name: 'bronze', threshold: settings?.bronzeThreshold || 0 },
      { name: 'silver', threshold: settings?.silverThreshold || 200 },
      { name: 'gold', threshold: settings?.goldThreshold || 500 },
      { name: 'platinum', threshold: settings?.platinumThreshold || 1000 },
    ];

    const currentLevelIndex = levels.findIndex(
      l => l.name === customer.level.toLowerCase()
    );
    const nextLevel = levels[currentLevelIndex + 1] || null;
    const pointsToNextLevel = nextLevel
      ? nextLevel.threshold - customer.points
      : 0;

    // Get available rewards
    const rewards = await this.prisma.loyaltyReward.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
        deletedAt: null,
      },
    });

    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      type: reward.type.toLowerCase().replace('_', '-'),
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      available: customer.points >= reward.pointsCost,
    }));

    // Get loyalty history
    const history = await this.prisma.loyaltyHistory.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formattedHistory = history.map(h => ({
      date: h.createdAt.toISOString(),
      type: h.points > 0 ? 'earned' : 'redeemed',
      points: Math.abs(h.points),
      description: h.notes || `Pedido`,
    }));

    // Count orders
    const totalOrders = await this.prisma.order.count({
      where: {
        customerId: customer.id,
        status: 'COMPLETED',
      },
    });

    return {
      points: customer.points,
      level: customer.level.toLowerCase(),
      nextLevel: nextLevel?.name || null,
      pointsToNextLevel: Math.max(0, pointsToNextLevel),
      totalOrders,
      rewards: formattedRewards,
      history: formattedHistory,
    };
  }
}
