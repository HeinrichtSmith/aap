import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create company
  const company = await prisma.company.upsert({
    where: { name: 'Arrowhead Polaris' },
    update: {},
    create: {
      name: 'Arrowhead Polaris',
      plan: 'ELITE',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created company: ${company.name}`);

  // Create site
  const site = await prisma.site.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      companyId: company.id,
      code: 'MAIN',
      name: 'Main Warehouse',
      address: {
        street: '123 Warehouse Way',
        city: 'Auckland',
        country: 'New Zealand',
        postcode: '1010',
      },
      isActive: true,
    },
  });
  console.log(`✅ Created site: ${site.name}`);

  // Create admin user (ensure password is always hashed correctly)
  const hashedPassword = await bcrypt.hash('admin123', 10); // Hash the password properly
  const user = await prisma.user.upsert({
    where: { email: 'admin@arrowhead.co.nz' },
    update: {
      password: hashedPassword, // Always update password to ensure it's hashed
    },
    create: {
      email: 'admin@arrowhead.co.nz',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      level: 10,
      xp: 5000,
      xpToNextLevel: 10000,
      department: 'Management',
      companyId: company.id,
      siteId: site.id,
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create user stats
  await prisma.userStats.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ordersProcessed: 50,
      itemsPicked: 500,
      itemsPacked: 500,
      purchaseOrdersReceived: 20,
      itemsReceived: 300,
      accuracy: 98.5,
      averagePickTime: 120,
      averagePackTime: 90,
      averageReceiveTime: 150,
    },
  });

  // Create bins (using upsert to handle duplicates)
  const bins = [];
  for (const zone of ['A', 'B', 'C']) {
    for (let aisle = 1; aisle <= 3; aisle++) {
      for (let position = 1; position <= 5; position++) {
        const bin = await prisma.bin.upsert({
          where: { code: `${zone}-${String(aisle).padStart(2, '0')}-${String(position).padStart(2, '0')}` },
          update: {},
          create: {
            companyId: company.id,
            code: `${zone}-${String(aisle).padStart(2, '0')}-${String(position).padStart(2, '0')}`,
            location: `${zone}-${String(aisle).padStart(2, '0')}-${String(position).padStart(2, '0')}`,
            aisle: String(aisle).padStart(2, '0'),
            row: zone,
            column: String(position).padStart(2, '0'),
            capacity: 100,
            type: 'medium',
            isAvailable: true,
            status: 'active',
          },
        });
        bins.push(bin);
      }
    }
  }
  console.log(`✅ Created ${bins.length} bins`);

  // Create sample products
  const products = [];
  const productData = [
    { sku: 'SKU-001', name: 'Wireless Mouse', category: 'Electronics', price: 29.99, barcode: '1234567890123' },
    { sku: 'SKU-002', name: 'USB-C Cable', category: 'Electronics', price: 14.99, barcode: '1234567890124' },
    { sku: 'SKU-003', name: 'Keyboard', category: 'Electronics', price: 49.99, barcode: '1234567890125' },
    { sku: 'SKU-004', name: 'Monitor Stand', category: 'Accessories', price: 39.99, barcode: '1234567890126' },
    { sku: 'SKU-005', name: 'Webcam HD', category: 'Electronics', price: 59.99, barcode: '1234567890127' },
  ];

  for (const data of productData) {
    const product = await prisma.product.upsert({
      where: { barcode: data.barcode },
      update: {},
      create: {
        companyId: company.id,
        siteId: site.id,
        sku: data.sku,
        name: data.name,
        category: data.category,
        price: data.price,
        weight: 0.5,
        dimensions: { length: 10, width: 10, height: 5 },
        barcode: data.barcode,
        reorderPoint: 10,
        reorderQuantity: 50,
      },
    });
    products.push(product);
  }
  console.log(`✅ Created ${products.length} products`);

  // Create inventory items (using upsert to handle duplicates)
  for (let i = 0; i < products.length; i++) {
    const bin = bins[i % bins.length];
    const product = products[i];
    await prisma.inventoryItem.upsert({
      where: {
        productId_binId: {
          productId: product.id,
          binId: bin.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        binId: bin.id,
        siteId: site.id,
        quantity: 50,
        quantityTotal: 50,
        quantityAvailable: 50,
        quantityReserved: 0,
      },
    });
  }
  console.log(`✅ Created inventory items`);

  // Create sample orders (using upsert)
  const orders = [];
  for (let i = 1; i <= 5; i++) {
    const order = await prisma.order.upsert({
      where: { id: `ORD-${String(i).padStart(5, '0')}` },
      update: {},
      create: {
        id: `ORD-${String(i).padStart(5, '0')}`,
        customerName: `Customer ${i}`,
        customerEmail: `customer${i}@example.com`,
        customerPhone: `+64 21 ${String(100000 + i).slice(1)}`,
        status: i <= 2 ? 'PENDING' : 'PICKING',
        priority: i === 1 ? 'URGENT' : 'NORMAL',
        siteId: site.id,
        shippingAddress: {
          street: `${i} Example Street`,
          city: 'Auckland',
          country: 'New Zealand',
          postcode: '1010',
        },
        assignedPickerId: user.id,
        notes: i === 1 ? 'Urgent delivery' : null,
      },
    });
    orders.push(order);
  }
  console.log(`✅ Created ${orders.length} orders`);

  // Create order items
  for (const order of orders) {
    for (let i = 0; i < 3; i++) {
      const product = products[i % products.length];
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          barcode: product.barcode,
          quantity: i + 1,
          pickedQuantity: 0,
          packedQuantity: 0,
          location: 'A-01-01',
        },
      });
    }
  }
  console.log(`✅ Created order items`);

  console.log('🎉 Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });