const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.inventoryItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    console.log('👤 Creating users...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN',
        avatar: '👨‍💼'
      }
    });

    const picker = await prisma.user.create({
      data: {
        email: 'picker@example.com',
        password: 'password123',
        name: 'John Picker',
        role: 'PICKER',
        avatar: '👷'
      }
    });

    const packer = await prisma.user.create({
      data: {
        email: 'packer@example.com',
        password: 'password123',
        name: 'Sarah Packer',
        role: 'PACKER',
        avatar: '👩‍🔧'
      }
    });

    // Create Products
    console.log('📦 Creating products...');
    const product1 = await prisma.product.create({
      data: {
        sku: 'PIR-SENS-001',
        name: 'PIR Motion Sensor',
        description: 'High-sensitivity motion detector for security systems',
        category: 'Security',
        price: 29.99,
        stockLevel: 150,
        reorderLevel: 50,
        reorderQuantity: 100,
        unit: 'each'
      }
    });

    const product2 = await prisma.product.create({
      data: {
        sku: 'CAM-PTZ-002',
        name: 'PTZ Security Camera',
        description: 'Pan-Tilt-Zoom 1080p camera with night vision',
        category: 'Security',
        price: 149.99,
        stockLevel: 45,
        reorderLevel: 20,
        reorderQuantity: 50,
        unit: 'each'
      }
    });

    const product3 = await prisma.product.create({
      data: {
        sku: 'DOO-LOCK-003',
        name: 'Smart Door Lock',
        description: 'Biometric smart lock with app control',
        category: 'Security',
        price: 89.99,
        stockLevel: 80,
        reorderLevel: 30,
        reorderQuantity: 50,
        unit: 'each'
      }
    });

    const product4 = await prisma.product.create({
      data: {
        sku: 'HUB-WIFI-004',
        name: 'Smart Hub WiFi',
        description: 'Central hub for all smart home devices',
        category: 'Automation',
        price: 59.99,
        stockLevel: 120,
        reorderLevel: 40,
        reorderQuantity: 80,
        unit: 'each'
      }
    });

    const product5 = await prisma.product.create({
      data: {
        sku: 'SEN-WIND-005',
        name: 'Window Sensor',
        description: 'Magnetic contact sensor for windows',
        category: 'Security',
        price: 19.99,
        stockLevel: 200,
        reorderLevel: 100,
        reorderQuantity: 150,
        unit: 'each'
      }
    });

    // Create Inventory Items
    console.log('📊 Creating inventory items...');
    await prisma.inventoryItem.createMany({
      data: [
        { productId: product1.id, location: 'A-01-01', quantity: 50, binId: 'BIN-001' },
        { productId: product1.id, location: 'A-01-02', quantity: 50, binId: 'BIN-002' },
        { productId: product1.id, location: 'A-01-03', quantity: 50, binId: 'BIN-003' },
        { productId: product2.id, location: 'B-01-01', quantity: 30, binId: 'BIN-004' },
        { productId: product2.id, location: 'B-01-02', quantity: 15, binId: 'BIN-005' },
        { productId: product3.id, location: 'C-01-01', quantity: 40, binId: 'BIN-006' },
        { productId: product3.id, location: 'C-01-02', quantity: 40, binId: 'BIN-007' },
        { productId: product4.id, location: 'D-01-01', quantity: 60, binId: 'BIN-008' },
        { productId: product4.id, location: 'D-01-02', quantity: 60, binId: 'BIN-009' },
        { productId: product5.id, location: 'E-01-01', quantity: 100, binId: 'BIN-010' },
        { productId: product5.id, location: 'E-01-02', quantity: 100, binId: 'BIN-011' },
      ]
    });

    // Create Orders
    console.log('📋 Creating orders...');
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-001',
        customerName: 'Auckland Security',
        status: 'PENDING',
        priority: 'HIGH',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: product1.id, quantity: 10, price: 29.99 },
            { productId: product2.id, quantity: 2, price: 149.99 },
            { productId: product5.id, quantity: 20, price: 19.99 },
          ]
        }
      }
    });

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-002',
        customerName: 'Wellington Homes',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: product3.id, quantity: 5, price: 89.99 },
            { productId: product4.id, quantity: 2, price: 59.99 },
          ]
        }
      }
    });

    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-003',
        customerName: 'Christchurch Systems',
        status: 'PENDING',
        priority: 'LOW',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: product1.id, quantity: 25, price: 29.99 },
            { productId: product5.id, quantity: 50, price: 19.99 },
          ]
        }
      }
    });

    const order4 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-004',
        customerName: 'Dunedin Security',
        status: 'PICKING',
        priority: 'HIGH',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: product2.id, quantity: 5, price: 149.99 },
            { productId: product3.id, quantity: 10, price: 89.99 },
          ]
        }
      }
    });

    const order5 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-005',
        customerName: 'Hamilton Tech',
        status: 'PACKED',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: product1.id, quantity: 15, price: 29.99 },
            { productId: product4.id, quantity: 8, price: 59.99 },
          ]
        }
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: 3`);
    console.log(`   Products: 5`);
    console.log(`   Inventory Items: 11`);
    console.log(`   Orders: 5`);
    console.log('\n🔐 Login credentials:');
    console.log(`   Admin: admin@example.com / password123`);
    console.log(`   Picker: picker@example.com / password123`);
    console.log(`   Packer: packer@example.com / password123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    console.log('✨ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
