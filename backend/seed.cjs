const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.site.deleteMany();
  console.log('Cleared existing data');

  const company = await prisma.company.create({
    data: {
      name: 'Arrowhead Logistics',
      plan: 'ELITE',
      status: 'ACTIVE'
    }
  });
  console.log('Created company:', company.name);

  const site = await prisma.site.create({
    data: {
      companyId: company.id,
      code: 'MAIN',
      name: 'Main Warehouse',
      isActive: true
    }
  });
  console.log('Created site:', site.name);

  const product1Id = uuidv4();
  const product2Id = uuidv4();
  const product3Id = uuidv4();
  const product4Id = uuidv4();
  
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: product1Id,
        companyId: company.id,
        siteId: site.id,
        sku: 'SKU001',
        name: 'Product 001',
        description: 'Test product 1',
        category: 'Electronics',
        price: 99.99,
        weight: 1.5,
        dimensions: { length: 10, width: 5, height: 3 },
        barcode: '1234567890123',
        reorderPoint: 10,
        reorderQuantity: 20
      }
    }),
    prisma.product.create({
      data: {
        id: product2Id,
        companyId: company.id,
        siteId: site.id,
        sku: 'SKU002',
        name: 'Product 002',
        description: 'Test product 2',
        category: 'Clothing',
        price: 49.99,
        weight: 0.5,
        dimensions: { length: 15, width: 10, height: 2 },
        barcode: '1234567890124',
        reorderPoint: 5,
        reorderQuantity: 15
      }
    }),
    prisma.product.create({
      data: {
        id: product3Id,
        companyId: company.id,
        siteId: site.id,
        sku: 'SKU003',
        name: 'Product 003',
        description: 'Test product 3',
        category: 'Home Goods',
        price: 29.99,
        weight: 2.0,
        dimensions: { length: 20, width: 15, height: 10 },
        barcode: '1234567890125',
        reorderPoint: 8,
        reorderQuantity: 16
      }
    }),
    prisma.product.create({
      data: {
        id: product4Id,
        companyId: company.id,
        siteId: site.id,
        sku: 'SKU004',
        name: 'Product 004',
        description: 'Test product 4',
        category: 'Electronics',
        price: 149.99,
        weight: 3.0,
        dimensions: { length: 25, width: 20, height: 15 },
        barcode: '1234567890126',
        reorderPoint: 5,
        reorderQuantity: 10
      }
    })
  ]);
  console.log('Created', products.length, 'products');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@arrowhead.co.nz',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      department: 'Warehouse',
      companyId: company.id,
      siteId: site.id,
      avatar: 'emoji',
      stats: {
        create: {}
      }
    }
  });
  console.log('Created admin user:', admin.email);

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
            { productId: product1Id, sku: 'SKU001', quantity: 5, pickedQuantity: 0, location: 'A-01-01' },
            { productId: product2Id, sku: 'SKU002', quantity: 3, pickedQuantity: 0, location: 'A-01-02' }
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
            { productId: product3Id, sku: 'SKU003', quantity: 2, pickedQuantity: 1, location: 'B-01-01' }
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
            { productId: product1Id, sku: 'SKU001', quantity: 10, pickedQuantity: 0, location: 'C-01-01' },
            { productId: product4Id, sku: 'SKU004', quantity: 7, pickedQuantity: 0, location: 'C-01-02' }
          ]
        }
    })
  ]);
  
  console.log('Created', orders.length, 'test orders');
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