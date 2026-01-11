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

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@arrowhead.co.nz' },
    update: {
      password: hashedPassword,
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

  // Create picker user
  const pickerPassword = await bcrypt.hash('picker123', 10);
  const picker = await prisma.user.upsert({
    where: { email: 'picker@arrowhead.co.nz' },
    update: {},
    create: {
      email: 'picker@arrowhead.co.nz',
      password: pickerPassword,
      name: 'John Picker',
      role: 'PICKER',
      level: 5,
      xp: 2500,
      xpToNextLevel: 5000,
      department: 'Warehouse',
      companyId: company.id,
      siteId: site.id,
    },
  });
  console.log(`✅ Created picker: ${picker.email}`);

  // Create picker stats
  await prisma.userStats.upsert({
    where: { userId: picker.id },
    update: {},
    create: {
      userId: picker.id,
      ordersProcessed: 30,
      itemsPicked: 300,
      itemsPacked: 0,
      accuracy: 97.0,
      averagePickTime: 150,
    },
  });

  // Create bins (without location field)
  const bins = [];
  for (const zone of ['A', 'B', 'C']) {
    for (let aisle = 1; aisle <= 3; aisle++) {
      for (let position = 1; position <= 5; position++) {
        const binCode = `${zone}-${String(aisle).padStart(2, '0')}-${String(position).padStart(2, '0')}`;
        const bin = await prisma.bin.upsert({
          where: { code: binCode },
          update: {},
          create: {
            companyId: company.id,
            code: binCode,
            aisle: String(aisle).padStart(2, '0'),
            row: zone,
            column: String(position).padStart(2, '0'),
            capacity: 100,
            type: 'medium',
            isAvailable: true,
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
    { sku: 'SKU-006', name: 'Laptop Sleeve', category: 'Accessories', price: 24.99, barcode: '1234567890128' },
    { sku: 'SKU-007', name: 'HDMI Cable 2m', category: 'Electronics', price: 19.99, barcode: '1234567890129' },
    { sku: 'SKU-008', name: 'Desk Lamp LED', category: 'Office', price: 34.99, barcode: '1234567890130' },
    { sku: 'SKU-009', name: 'Mousepad XL', category: 'Accessories', price: 12.99, barcode: '1234567890131' },
    { sku: 'SKU-010', name: 'USB Hub 7-Port', category: 'Electronics', price: 29.99, barcode: '1234567890132' },
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

  // Create inventory items
  for (let i = 0; i < products.length; i++) {
    const bin = bins[i % bins.length];
    const product = products[i];

    // Check if inventory item already exists
    const existing = await prisma.inventoryItem.findUnique({
      where: {
        productId_binId: {
          productId: product.id,
          binId: bin.id,
        },
      },
    });

    if (!existing) {
      await prisma.inventoryItem.create({
        data: {
          productId: product.id,
          binId: bin.id,
          sku: product.sku,
          binLocation: bin.code,
          siteId: site.id,
          quantityTotal: 50,
          quantityAvailable: 50,
          quantityReserved: 0,
          status: 'AVAILABLE',
        },
      });
    }
  }
  console.log(`✅ Created inventory items`);

  // Create sample orders
  const orders = [];
  const orderData = [
    { id: 'SO-00123', status: 'PENDING', priority: 'URGENT', customer: 'Alice Johnson' },
    { id: 'SO-00124', status: 'PENDING', priority: 'NORMAL', customer: 'Bob Smith' },
    { id: 'SO-00125', status: 'PICKING', priority: 'NORMAL', customer: 'Carol White' },
    { id: 'SO-00126', status: 'PICKING', priority: 'URGENT', customer: 'David Brown' },
    { id: 'SO-00127', status: 'READY_TO_PACK', priority: 'NORMAL', customer: 'Eve Davis' },
    { id: 'SO-00128', status: 'PACKED', priority: 'NORMAL', customer: 'Frank Miller' },
    { id: 'SO-00129', status: 'SHIPPED', priority: 'LOW', customer: 'Grace Lee' },
    { id: 'SO-00130', status: 'PENDING', priority: 'OVERNIGHT', customer: 'Henry Wilson' },
  ];

  for (const data of orderData) {
    const existing = await prisma.order.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      const order = await prisma.order.create({
        data: {
          id: data.id,
          customerName: data.customer,
          customerEmail: data.customer.toLowerCase().replace(' ', '.') + '@example.com',
          customerPhone: '+64 21 123 4567',
          status: data.status,
          priority: data.priority,
          siteId: site.id,
          shippingAddress: {
            street: '123 Delivery Street',
            city: 'Auckland',
            country: 'New Zealand',
            postcode: '1010',
          },
          assignedPickerId: data.status === 'PENDING' ? null : picker.id,
          assignedPackerId: data.status === 'PACKED' || data.status === 'SHIPPED' ? user.id : null,
          notes: data.priority === 'URGENT' ? 'Urgent delivery requested' : null,
        },
      });
      orders.push(order);
    } else {
      orders.push(existing);
    }
  }
  console.log(`✅ Created ${orders.length} orders`);

  // Create order items
  for (const order of orders) {
    const existingItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    if (existingItems.length === 0) {
      for (let i = 0; i < 3; i++) {
        const product = products[i % products.length];
        const bin = bins[i % bins.length];

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            barcode: product.barcode,
            quantity: (i + 1) * 2,
            pickedQuantity: order.status === 'PACKED' || order.status === 'SHIPPED' ? (i + 1) * 2 : 0,
            packedQuantity: order.status === 'PACKED' || order.status === 'SHIPPED' ? (i + 1) * 2 : 0,
            location: bin.code,
          },
        });
      }
    }
  }
  console.log(`✅ Created order items`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('   Admin: admin@arrowhead.co.nz / admin123');
  console.log('   Picker: picker@arrowhead.co.nz / picker123');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
