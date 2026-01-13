import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Get or create settings
    let settings = await this.prisma.restaurantSettings.findUnique({
      where: { restaurantId },
    });

    if (!settings) {
      settings = await this.prisma.restaurantSettings.create({
        data: { restaurantId },
      });
    }

    const address = restaurant.address as any || {};

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        cnpj: restaurant.cnpj,
        address: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        phone: restaurant.phone,
        email: restaurant.email,
        website: address.website || '',
        description: address.description || '',
        logo: address.logo || null,
        coverImage: address.coverImage || null,
      },
      openingHours: restaurant.openingHours || {
        monday: { open: '11:00', close: '23:00', closed: false },
        tuesday: { open: '11:00', close: '23:00', closed: false },
        wednesday: { open: '11:00', close: '23:00', closed: false },
        thursday: { open: '11:00', close: '23:00', closed: false },
        friday: { open: '11:00', close: '23:00', closed: false },
        saturday: { open: '11:00', close: '23:00', closed: false },
        sunday: { open: '11:00', close: '22:00', closed: false },
      },
      socialMedia: {
        instagram: settings.instagram,
        facebook: settings.facebook,
        whatsapp: settings.whatsapp,
        tiktok: settings.tiktok,
      },
      loyalty: {
        enabled: settings.loyaltyEnabled,
        pointsPerReal: settings.pointsPerReal,
        bronzeThreshold: settings.bronzeThreshold,
        silverThreshold: settings.silverThreshold,
        goldThreshold: settings.goldThreshold,
        platinumThreshold: settings.platinumThreshold,
        pointsExpiration: settings.pointsExpiration,
        welcomeBonus: settings.welcomeBonus,
        birthdayBonus: settings.birthdayBonus,
        referralBonus: settings.referralBonus,
      },
      notifications: {
        newCustomer: settings.notifyNewCustomer,
        campaignResults: settings.notifyCampaignResults,
        lowStock: settings.notifyLowStock,
        dailyReport: settings.notifyDailyReport,
        orderReceived: settings.notifyOrderReceived,
        paymentReceived: settings.notifyPaymentReceived,
        systemUpdates: settings.notifySystemUpdates,
      },
      integrations: settings.integrations || {
        whatsapp: { enabled: false, phoneNumber: null },
        email: { enabled: false, provider: null, senderEmail: null },
        delivery: {
          ifood: { enabled: false, storeId: null },
          ubereats: { enabled: false, storeId: null },
          rappi: { enabled: false, storeId: null },
        },
      },
    };
  }

  async updateRestaurant(
    restaurantId: string,
    dto: {
      name?: string;
      cnpj?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
      email?: string;
      website?: string;
      description?: string;
    },
    userId: string,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const currentAddress = restaurant.address as any || {};

    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: dto.name,
        cnpj: dto.cnpj,
        phone: dto.phone,
        email: dto.email,
        address: {
          ...currentAddress,
          street: dto.address ?? currentAddress.street,
          city: dto.city ?? currentAddress.city,
          state: dto.state ?? currentAddress.state,
          zipCode: dto.zipCode ?? currentAddress.zipCode,
          website: dto.website ?? currentAddress.website,
          description: dto.description ?? currentAddress.description,
        },
      },
    });

    return {
      id: updatedRestaurant.id,
      name: updatedRestaurant.name,
      cnpj: updatedRestaurant.cnpj,
      phone: updatedRestaurant.phone,
      email: updatedRestaurant.email,
      address: updatedRestaurant.address,
    };
  }

  async updateOpeningHours(
    restaurantId: string,
    dto: Record<string, { open: string; close: string; closed: boolean }>,
  ) {
    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { openingHours: dto },
    });

    return { openingHours: updated.openingHours };
  }

  async updateSocialMedia(
    restaurantId: string,
    dto: {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
      tiktok?: string;
    },
  ) {
    const settings = await this.prisma.restaurantSettings.upsert({
      where: { restaurantId },
      update: {
        instagram: dto.instagram,
        facebook: dto.facebook,
        whatsapp: dto.whatsapp,
        tiktok: dto.tiktok,
      },
      create: {
        restaurantId,
        instagram: dto.instagram,
        facebook: dto.facebook,
        whatsapp: dto.whatsapp,
        tiktok: dto.tiktok,
      },
    });

    return {
      instagram: settings.instagram,
      facebook: settings.facebook,
      whatsapp: settings.whatsapp,
      tiktok: settings.tiktok,
    };
  }

  async updateLoyalty(
    restaurantId: string,
    dto: {
      enabled?: boolean;
      pointsPerReal?: number;
      bronzeThreshold?: number;
      silverThreshold?: number;
      goldThreshold?: number;
      platinumThreshold?: number;
      pointsExpiration?: number;
      welcomeBonus?: number;
      birthdayBonus?: number;
      referralBonus?: number;
    },
  ) {
    const settings = await this.prisma.restaurantSettings.upsert({
      where: { restaurantId },
      update: {
        loyaltyEnabled: dto.enabled,
        pointsPerReal: dto.pointsPerReal,
        bronzeThreshold: dto.bronzeThreshold,
        silverThreshold: dto.silverThreshold,
        goldThreshold: dto.goldThreshold,
        platinumThreshold: dto.platinumThreshold,
        pointsExpiration: dto.pointsExpiration,
        welcomeBonus: dto.welcomeBonus,
        birthdayBonus: dto.birthdayBonus,
        referralBonus: dto.referralBonus,
      },
      create: {
        restaurantId,
        loyaltyEnabled: dto.enabled,
        pointsPerReal: dto.pointsPerReal,
        bronzeThreshold: dto.bronzeThreshold,
        silverThreshold: dto.silverThreshold,
        goldThreshold: dto.goldThreshold,
        platinumThreshold: dto.platinumThreshold,
        pointsExpiration: dto.pointsExpiration,
        welcomeBonus: dto.welcomeBonus,
        birthdayBonus: dto.birthdayBonus,
        referralBonus: dto.referralBonus,
      },
    });

    return {
      enabled: settings.loyaltyEnabled,
      pointsPerReal: settings.pointsPerReal,
      bronzeThreshold: settings.bronzeThreshold,
      silverThreshold: settings.silverThreshold,
      goldThreshold: settings.goldThreshold,
      platinumThreshold: settings.platinumThreshold,
      pointsExpiration: settings.pointsExpiration,
      welcomeBonus: settings.welcomeBonus,
      birthdayBonus: settings.birthdayBonus,
      referralBonus: settings.referralBonus,
    };
  }

  async updateNotifications(
    restaurantId: string,
    dto: {
      newCustomer?: boolean;
      campaignResults?: boolean;
      lowStock?: boolean;
      dailyReport?: boolean;
      orderReceived?: boolean;
      paymentReceived?: boolean;
      systemUpdates?: boolean;
    },
  ) {
    const settings = await this.prisma.restaurantSettings.upsert({
      where: { restaurantId },
      update: {
        notifyNewCustomer: dto.newCustomer,
        notifyCampaignResults: dto.campaignResults,
        notifyLowStock: dto.lowStock,
        notifyDailyReport: dto.dailyReport,
        notifyOrderReceived: dto.orderReceived,
        notifyPaymentReceived: dto.paymentReceived,
        notifySystemUpdates: dto.systemUpdates,
      },
      create: {
        restaurantId,
        notifyNewCustomer: dto.newCustomer,
        notifyCampaignResults: dto.campaignResults,
        notifyLowStock: dto.lowStock,
        notifyDailyReport: dto.dailyReport,
        notifyOrderReceived: dto.orderReceived,
        notifyPaymentReceived: dto.paymentReceived,
        notifySystemUpdates: dto.systemUpdates,
      },
    });

    return {
      newCustomer: settings.notifyNewCustomer,
      campaignResults: settings.notifyCampaignResults,
      lowStock: settings.notifyLowStock,
      dailyReport: settings.notifyDailyReport,
      orderReceived: settings.notifyOrderReceived,
      paymentReceived: settings.notifyPaymentReceived,
      systemUpdates: settings.notifySystemUpdates,
    };
  }
}
