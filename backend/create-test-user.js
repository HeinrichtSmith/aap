import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create company
    const company = await prisma.company.upsert({
      where: { name: 'Arrowhead Polaris' },
      update: {},
      create: {
        name: 'Arrowhead Polaris',
        plan: 'ELITE',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Company:', company.name);

    // Create site
    const site = await prisma.site.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        code: 'MAIN',
        name: 'Main Warehouse',
        companyId: company.id,
        isActive: true
      }
    });
    console.log('✅ Site:', site.name);

    // Create user
    const user = await prisma.user.upsert({
      where: { email: 'admin@arrowhead.co.nz' },
      update: {},
      create: {
        email: 'admin@arrowhead.co.nz',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        department: 'Management',
        companyId: company.id,
        siteId: site.id,
        level: 10,
        xp: 5000
      }
    });
    console.log('✅ User created:', user.email);
    console.log('   Password: admin123');

    // Create user stats
    const stats = await prisma.userStats.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ordersProcessed: 0,
        itemsPicked: 0,
        itemsPacked: 0,
        accuracy: 100
      }
    });
    console.log('✅ User stats created');

    console.log('\n🎉 Test user created successfully!');
    console.log('\nLogin credentials:');
    console.log('   Email: admin@arrowhead.co.nz');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
