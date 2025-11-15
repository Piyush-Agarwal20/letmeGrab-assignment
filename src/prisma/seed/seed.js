const { PrismaClient } = require('../../prisma/generated/main');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Welcome Coupon (One-time use per user)
    console.log('Creating welcome coupon...');
    const welcomeCoupon = await prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minPurchase: 0,
        maxDiscount: 100,
        usageLimitPerUser: 1, // One-time use per user
        totalUsageLimit: null, // No global limit
        currentUsageCount: 0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
    });
    console.log('✅ Welcome coupon created:', welcomeCoupon.code, '(1 use per user)');

    // 2. Create Additional Coupons for testing
    console.log('Creating additional coupons...');

    const fixedCoupon = await prisma.coupon.upsert({
      where: { code: 'SAVE50' },
      update: {},
      create: {
        code: 'SAVE50',
        discountType: 'FIXED',
        discountValue: 50,
        minPurchase: 200,
        maxDiscount: null,
        usageLimitPerUser: 3, // Can use 3 times per user
        totalUsageLimit: null,
        currentUsageCount: 0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
    console.log('✅ Fixed coupon created:', fixedCoupon.code, '(3 uses per user)');

    const percentageCoupon = await prisma.coupon.upsert({
      where: { code: 'DISCOUNT20' },
      update: {},
      create: {
        code: 'DISCOUNT20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minPurchase: 500,
        maxDiscount: 200,
        usageLimitPerUser: null, // Unlimited per user
        totalUsageLimit: 100, // Global limit: first 100 redemptions
        currentUsageCount: 0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
    console.log('✅ Percentage coupon created:', percentageCoupon.code, '(unlimited per user, 100 global limit)');

    // 3. Create Sample Seller
    console.log('Creating sample seller...');
    const hashedPassword = await bcrypt.hash('Seller@123', 10);

    const seller = await prisma.seller.upsert({
      where: { email: 'seller@example.com' },
      update: {},
      create: {
        email: 'seller@example.com',
        password: hashedPassword,
        name: 'John Seller',
        shopName: 'Tech Store',
      },
    });
    console.log('✅ Sample seller created:', seller.email);

    // 4. Create Sample Products
    console.log('Creating sample products...');

    const products = [
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 299,
        stock: 50,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical gaming keyboard',
        price: 1499,
        stock: 30,
      },
      {
        name: 'USB-C Cable',
        description: 'Fast charging USB-C to USB-C cable (1m)',
        price: 199,
        stock: 100,
      },
      {
        name: 'Laptop Stand',
        description: 'Aluminum laptop stand with adjustable height',
        price: 899,
        stock: 25,
      },
      {
        name: 'Webcam HD',
        description: '1080p HD webcam with built-in microphone',
        price: 2499,
        stock: 15,
      },
    ];

    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: {
          id: `${seller.id}-${productData.name.toLowerCase().replace(/\s+/g, '-')}`
        },
        update: {},
        create: {
          ...productData,
          sellerId: seller.id,
          isActive: true,
        },
      });
      console.log(`✅ Product created: ${product.name} - ₹${product.price}`);
    }

    // 5. Create Sample User (Optional - for testing)
    console.log('Creating sample user...');
    const userHashedPassword = await bcrypt.hash('User@123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        password: userHashedPassword,
        name: 'Jane User',
        walletPoints: 100,
        userCoupons: {
          create: {
            couponId: welcomeCoupon.id,
          },
        },
      },
    });
    console.log('✅ Sample user created:', user.email);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Seller: seller@example.com / Seller@123');
    console.log('User: user@example.com / User@123');
    console.log('\n🎟️  Available Coupons:');
    console.log('- WELCOME10 (10% off, max ₹100)');
    console.log('- SAVE50 (₹50 off, min purchase ₹200)');
    console.log('- DISCOUNT20 (20% off, max ₹200, min purchase ₹500)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });