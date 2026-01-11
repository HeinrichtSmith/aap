const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function main() {
  console.log('Starting database seed...');
  
  // Clear existing data
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@arrowhead.co.nz',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      department: 'Warehouse',
      avatar: '👤',
      stats: {
        create: {}
      }
    }
  });
  console.log('Created admin user:', admin.email);

  // Create test orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        customerName: 'John Smith',
        status: 'PENDING',
        priority: 'NORMAL',
        items: {
          create: [
            { productId: 'SKU001', quantity: 5, pickedQuantity: 0 },
            { productId: 'SKU002', quantity: 3, pickedQuantity: 0 }
          ]
        }
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-002',
        customerName: 'Jane Doe',
        status: 'PICKING',
        priority: 'URGENT',
        items: {
          create: [
            { productId: 'SKU003', quantity: 2, pickedQuantity: 1 }
          ]
        }
      }
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-003',
        customerName: 'Bob Wilson',
        status: 'PENDING',
        priority: 'NORMAL',
        items: {
          create: [
            { productId: 'SKU001', quantity: 10, pickedQuantity: 0 },
            { productId: 'SKU004', quantity: 7, pickedQuantity: 0 }
          ]
        }
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