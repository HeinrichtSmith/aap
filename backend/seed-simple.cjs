const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  await prisma.company.deleteMany();
  console.log('Cleared existing data');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Arrowhead Logistics',
      plan: 'ELITE',
      status: 'ACTIVE'
    }
  });
  console.log('Created company:', company.name);

  // Create site
  const site = await prisma.site.create({
    data: {
      companyId: company.id,
      code: 'MAIN',
      name: 'Main Warehouse',
      isActive: true
    }
  });
  console.log('Created site:', site.name);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: uuidv4(),
        companyId: company.id,
        sku: 'SKU001',
        name: 'Product 001',
        barcode: '1234567890123'
      }
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        companyId: company.id,
        sku: 'SKU002',
        name: 'Product 002',
        barcode: '1234567890124'
      }
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        companyId: company.id,
        sku: 'SKU003',
        name: 'Product 003',
        barcode: '1234567890125'
      }
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        companyId: company.id,
        sku: 'SKU004',
        name: 'Product 004',
        barcode: '1234567890126'
      }
    })
  ]);
  console.log(`Created ${products.length} products`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@arrowhead.co.nz',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      companyId: company.id,
      siteId: site.id
    }
  });
  console.log('Created admin user:', admin.email);

  // Create test orders
  const orderId1 = uuidv4();
  const orderId2 = uuidv4();
  const orderId3 = uuidv4();
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        id: orderId1,
        customerName: 'John Smith',
        customerEmail: 'john.smith@example.com',
        customerPhone: '+64 21 123 4567',
        status: 'PENDING',
        priority: 'NORMAL',
        siteId: site.id,
        shippingAddress: { street: '123 Main St', city: 'Auckland', country: 'NZ' },
        items: {
          create: [
            { sku: 'SKU001', name: 'Product 001', quantity: 5, location: 'A-01-01' },
            { sku: 'SKU002', name: 'Product 002', quantity: 3, location: 'A-01-02' }
          ]
        }
    }),
    prisma.order.create({
      data: {
        id: orderId2,
        customerName: 'Jane Doe',
        customerEmail: 'jane.doe@example.com',
        customerPhone: '+64 22 987 6543',
        status: 'PICKING',
        priority: 'URGENT',
        siteId: site.id,
        shippingAddress: { street: '456 Oak Ave', city: 'Wellington', country: 'NZ' },
        items: {
          create: [
            { sku: 'SKU003', name: 'Product 003', quantity: 2, location: 'B-01-01' }
          ]
        }
    }),
    prisma.order.create({
      data: {
        id: orderId3,
        customerName: 'Bob Wilson',
        customerEmail: 'bob.wilson@example.com',
        customerPhone: '+64 27 555 1234',
        status: 'PENDING',
        priority: 'NORMAL',
        siteId: site.id,
        shippingAddress: { street: '789 Pine Rd', city: 'Christchurch', country: 'NZ' },
        items: {
          create: [
            { sku: 'SKU001', name: 'Product 001', quantity: 10, location: 'C-01-01' },
            { sku: 'SKU004', name: 'Product 004', quantity: 7, location: 'C-01-02' }
          ]
        }
    })
  ]);
  
  console.log(`Created ${orders.length} test orders`);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });