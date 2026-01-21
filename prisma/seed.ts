import { PrismaClient, UserType, UserRole, RestaurantStatus, SubscriptionPlan, SubscriptionStatus, CustomerLevel, LoyaltyRuleType, LoyaltyRewardType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@gastrobi.com' },
    update: {},
    create: {
      email: 'admin@gastrobi.com',
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      type: UserType.ADMIN,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Create White Label Config
  const whiteLabel = await prisma.whiteLabelConfig.upsert({
    where: { domain: 'foodtech.pro' },
    update: {},
    create: {
      clientName: 'foodtech',
      brandName: 'FoodTech Pro',
      domain: 'foodtech.pro',
      primaryColor: '#059669',
      secondaryColor: '#047857',
      accentColor: '#8b5cf6',
      features: {
        pos: true,
        loyalty: true,
        campaigns: true,
        reports: true,
        qrCodes: true,
        delivery: true,
        multiRestaurant: true,
        whiteLabel: true,
        api: true,
        analytics: true,
      },
    },
  });
  console.log('✅ White Label created:', whiteLabel.brandName);

  // 3. Create Restaurant Owner
  const ownerPassword = await bcrypt.hash('123456', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'joao@restaurante.com' },
    update: {},
    create: {
      email: 'joao@restaurante.com',
      passwordHash: ownerPassword,
      fullName: 'João Silva',
      phone: '(11) 99999-9999',
      type: UserType.RESTAURANT,
      role: UserRole.OWNER,
      isActive: true,
    },
  });
  console.log('✅ Restaurant Owner created:', owner.email);

  // 4. Create Sample Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'restaurante-do-joao' },
    update: {},
    create: {
      slug: 'restaurante-do-joao',
      name: 'Restaurante do João',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3333-3333',
      email: 'contato@restaurantedojoao.com',
      status: RestaurantStatus.ACTIVE,
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      },
      settings: {
        loyaltyProgram: {
          enabled: true,
          pointsPerReal: 1,
          bronzeThreshold: 0,
          silverThreshold: 200,
          goldThreshold: 500,
        },
        notifications: {
          email: true,
          sms: true,
          whatsapp: true,
        },
      },
      openingHours: [
        { day: 'monday', open: '11:00', close: '23:00' },
        { day: 'tuesday', open: '11:00', close: '23:00' },
        { day: 'wednesday', open: '11:00', close: '23:00' },
        { day: 'thursday', open: '11:00', close: '23:00' },
        { day: 'friday', open: '11:00', close: '00:00' },
        { day: 'saturday', open: '11:00', close: '00:00' },
        { day: 'sunday', open: '11:00', close: '22:00' },
      ],
    },
  });
  console.log('✅ Restaurant created:', restaurant.name);

  // 5. Associate Owner with Restaurant
  await prisma.restaurantUser.upsert({
    where: {
      userId_restaurantId: {
        userId: owner.id,
        restaurantId: restaurant.id,
      },
    },
    update: {},
    create: {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: UserRole.OWNER,
      isDefault: true,
      permissions: ['all'],
    },
  });
  console.log('✅ Owner associated with restaurant');

  // 6. Create Subscription
  await prisma.subscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      period: 'monthly',
    },
  });
  console.log('✅ Subscription created');

  // 7. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Pizzas',
        description: 'Pizzas artesanais com massa tradicional',
        order: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Lanches',
        description: 'Hambúrguers e sanduíches gourmet',
        order: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e bebidas especiais',
        order: 3,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sobremesas',
        description: 'Doces e sobremesas da casa',
        order: 4,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Pratos Executivos',
        description: 'Pratos completos para o almoço',
        order: 5,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // 8. Create Products
  const products = await Promise.all([
    // Pizzas
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Pizza Margherita',
        description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
        price: 45.90,
        cost: 18.50,
        isActive: true,
        isAvailable: true,
        isBestSeller: true,
        order: 1,
        allergens: ['Glúten', 'Lactose'],
        preparationTime: 15,
        variations: [
          { id: '1', name: 'Pequena', price: 35.90, isDefault: false },
          { id: '2', name: 'Média', price: 45.90, isDefault: true },
          { id: '3', name: 'Grande', price: 55.90, isDefault: false },
        ],
        extras: [
          { id: '1', name: 'Borda recheada', price: 8.00 },
          { id: '2', name: 'Queijo extra', price: 5.00 },
        ],
        tags: ['Vegetariano', 'Clássico'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Pizza Pepperoni',
        description: 'Molho de tomate, mussarela e pepperoni',
        price: 52.90,
        cost: 22.00,
        isActive: true,
        isAvailable: true,
        isPromotion: true,
        originalPrice: 58.90,
        order: 2,
        allergens: ['Glúten', 'Lactose'],
        preparationTime: 15,
        tags: ['Picante'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[0].id,
        name: 'Pizza Quatro Queijos',
        description: 'Mussarela, gorgonzola, parmesão e provolone',
        price: 49.90,
        cost: 20.00,
        isActive: true,
        isAvailable: true,
        order: 3,
        allergens: ['Glúten', 'Lactose'],
        preparationTime: 15,
        tags: ['Vegetariano'],
      },
    }),
    // Lanches
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: 'Hambúrguer Artesanal',
        description: 'Pão brioche, carne 180g, queijo cheddar, alface, tomate e molho especial',
        price: 32.90,
        cost: 15.20,
        isActive: true,
        isAvailable: true,
        isBestSeller: true,
        isNew: true,
        order: 1,
        allergens: ['Glúten', 'Lactose'],
        preparationTime: 12,
        extras: [
          { id: '1', name: 'Bacon', price: 6.00 },
          { id: '2', name: 'Ovo', price: 4.00 },
          { id: '3', name: 'Batata frita', price: 8.00 },
        ],
        tags: ['Artesanal', 'Gourmet'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[1].id,
        name: 'X-Bacon Duplo',
        description: 'Pão, duas carnes 120g, bacon crocante, queijo e molho barbecue',
        price: 38.90,
        cost: 18.00,
        isActive: true,
        isAvailable: true,
        order: 2,
        allergens: ['Glúten', 'Lactose'],
        preparationTime: 15,
      },
    }),
    // Bebidas
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: 'Refrigerante Lata',
        description: 'Coca-Cola, Pepsi, Guaraná ou Fanta - 350ml',
        price: 6.50,
        cost: 2.80,
        isActive: true,
        isAvailable: true,
        order: 1,
        variations: [
          { id: '1', name: 'Coca-Cola', price: 6.50, isDefault: true },
          { id: '2', name: 'Pepsi', price: 6.50, isDefault: false },
          { id: '3', name: 'Guaraná', price: 6.50, isDefault: false },
        ],
        tags: ['Gelado'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[2].id,
        name: 'Suco Natural',
        description: 'Laranja, limão, abacaxi ou maracujá - 500ml',
        price: 12.00,
        cost: 5.00,
        isActive: true,
        isAvailable: true,
        order: 2,
        tags: ['Natural', 'Saudável'],
      },
    }),
    // Sobremesas
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[3].id,
        name: 'Pudim de Leite',
        description: 'Pudim caseiro com calda de caramelo',
        price: 12.90,
        cost: 4.50,
        isActive: true,
        isAvailable: true,
        order: 1,
        allergens: ['Lactose', 'Ovo'],
        tags: ['Caseiro', 'Tradicional'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[3].id,
        name: 'Petit Gateau',
        description: 'Bolo de chocolate com centro cremoso, servido com sorvete',
        price: 18.90,
        cost: 7.00,
        isActive: true,
        isAvailable: true,
        order: 2,
        allergens: ['Glúten', 'Lactose', 'Ovo'],
        tags: ['Premium'],
      },
    }),
    // Pratos Executivos
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[4].id,
        name: 'Prato Executivo - Frango Grelhado',
        description: 'Frango grelhado, arroz, feijão, batata frita e salada',
        price: 24.90,
        cost: 12.00,
        isActive: true,
        isAvailable: true,
        isBestSeller: true,
        order: 1,
        schedule: {
          startTime: '11:00',
          endTime: '15:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        tags: ['Completo', 'Saudável'],
      },
    }),
    prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categories[4].id,
        name: 'Prato Executivo - Bife Acebolado',
        description: 'Bife acebolado, arroz, feijão, purê e salada',
        price: 28.90,
        cost: 14.00,
        isActive: true,
        isAvailable: true,
        order: 2,
        schedule: {
          startTime: '11:00',
          endTime: '15:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        tags: ['Completo'],
      },
    }),
  ]);
  console.log('✅ Products created:', products.length);

  // 9. Create Tables
  const tables = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const tableNumber = String(i + 1).padStart(2, '0');
      return prisma.table.upsert({
        where: {
          restaurantId_number: {
            restaurantId: restaurant.id,
            number: tableNumber,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          number: tableNumber,
          capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        },
      });
    }),
  );
  console.log('✅ Tables created:', tables.length);

  // 10. Create Customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: '(11) 99999-1111',
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: 'Maria Silva',
        email: 'maria@email.com',
        phone: '(11) 99999-1111',
        birthday: new Date('1985-03-15'),
        points: 520,
        level: CustomerLevel.GOLD,
        totalSpent: 2850.50,
        visitCount: 45,
        referralCode: 'MARIA2024',
        tags: ['vip', 'frequente'],
        notes: 'Cliente preferencial, sempre pede pizza margherita',
      },
    }),
    prisma.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: '(11) 88888-2222',
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: 'João Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 88888-2222',
        birthday: new Date('1990-07-22'),
        points: 180,
        level: CustomerLevel.SILVER,
        totalSpent: 1200.00,
        visitCount: 20,
        referralCode: 'JOAO2024',
        tags: ['regular'],
      },
    }),
    prisma.customer.upsert({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: '(11) 77777-3333',
        },
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: 'Ana Costa',
        email: 'ana@email.com',
        phone: '(11) 77777-3333',
        birthday: new Date('1992-11-08'),
        points: 89,
        level: CustomerLevel.BRONZE,
        totalSpent: 890.30,
        visitCount: 12,
        referralCode: 'ANA2024',
        tags: ['saudável'],
        notes: 'Prefere opções saudáveis',
      },
    }),
  ]);
  console.log('✅ Customers created:', customers.length);

  // 11. Create Loyalty Rules
  const loyaltyRules = await Promise.all([
    prisma.loyaltyRule.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Compra realizada',
        type: LoyaltyRuleType.PURCHASE,
        points: 10,
        description: '10 pontos a cada R$ 10,00 gastos',
        isActive: true,
      },
    }),
    prisma.loyaltyRule.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Check-in no restaurante',
        type: LoyaltyRuleType.CHECKIN,
        points: 25,
        description: '25 pontos por check-in via app',
        isActive: true,
      },
    }),
    prisma.loyaltyRule.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Aniversário',
        type: LoyaltyRuleType.BIRTHDAY,
        points: 100,
        description: '100 pontos no mês do aniversário',
        isActive: true,
      },
    }),
    prisma.loyaltyRule.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Indicação de amigo',
        type: LoyaltyRuleType.REFERRAL,
        points: 150,
        description: '150 pontos por amigo que fizer primeira compra',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Loyalty Rules created:', loyaltyRules.length);

  // 12. Create Loyalty Rewards
  const loyaltyRewards = await Promise.all([
    prisma.loyaltyReward.create({
      data: {
        restaurantId: restaurant.id,
        name: '10% de desconto',
        pointsCost: 100,
        type: LoyaltyRewardType.DISCOUNT_PERCENTAGE,
        value: 10,
        description: '10% de desconto no próximo pedido',
        isActive: true,
      },
    }),
    prisma.loyaltyReward.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sobremesa grátis',
        pointsCost: 200,
        type: LoyaltyRewardType.FREE_PRODUCT,
        description: 'Uma sobremesa da casa',
        isActive: true,
      },
    }),
    prisma.loyaltyReward.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Entrega grátis',
        pointsCost: 150,
        type: LoyaltyRewardType.FREE_DELIVERY,
        description: 'Frete grátis no próximo delivery',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Loyalty Rewards created:', loyaltyRewards.length);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
