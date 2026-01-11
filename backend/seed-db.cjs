// Load environment variables
require('dotenv').config({ path: './.env' });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

/**
 * Generate a valid 12-digit barcode/SKU
 * @returns {string} - 12-digit numeric string
 */
function generateBarcode() {
  return Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, '0');
}

/**
 * Generate estimated pick minutes based on order complexity
 * @param {number} itemCount - Number of items in order
 * @returns {number} - Estimated minutes
 */
function generateEstimate(itemCount) {
  // Base: 2 minutes per item, minimum 5 minutes
  const baseTime = Math.max(5, itemCount * 2);
  // Add some randomization (±20%)
  const variance = Math.floor(baseTime * 0.2);
  return baseTime + Math.floor(Math.random() * (variance * 2)) - variance;
}

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.site.deleteMany();

    // Create or find Company first
    console.log('🏢 Creating company...');
    const company = await prisma.company.upsert({
      where: { name: 'Arrowhead Polaris' },
      update: {},
      create: {
        name: 'Arrowhead Polaris'
      }
    });

    // Create Users with bcrypt hashed passwords
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@arrowhead.co.nz',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        department: 'Management',
        avatar: '👨‍💼',
        companyId: company.id
      }
    });

    const picker = await prisma.user.create({
      data: {
        email: 'picker@example.com',
        password: hashedPassword,
        name: 'John Picker',
        role: 'PICKER',
        department: 'Warehouse',
        avatar: '👷',
        companyId: company.id
      }
    });

    const packer = await prisma.user.create({
      data: {
        email: 'packer@example.com',
        password: hashedPassword,
        name: 'Sarah Packer',
        role: 'PACKER',
        department: 'Warehouse',
        avatar: '👩‍🔧',
        companyId: company.id
      }
    });

    // Create Site
    console.log('🏢 Creating site...');
    const site = await prisma.site.create({
      data: {
        companyId: company.id,
        code: 'MAIN',
        name: 'Main Warehouse',
        address: { street: '123 Warehouse St', city: 'Auckland', country: 'NZ' }
      }
    });

    // Create Products with real 12-digit SKUs and barcodes
    console.log('📦 Creating products...');
    const sku1 = generateBarcode();
    const barcode1 = generateBarcode();
    const product1 = await prisma.product.create({
      data: {
        sku: sku1,
        name: 'PIR Motion Sensor',
        description: 'High-sensitivity motion detector for security systems',
        category: 'Security',
        price: 29.99,
        weight: 0.5,
        dimensions: { length: 10, width: 5, height: 2, unit: 'cm' },
        barcode: barcode1,
        reorderPoint: 50,
        reorderQuantity: 100,
        companyId: company.id
      }
    });

    const sku2 = generateBarcode();
    const barcode2 = generateBarcode();
    const product2 = await prisma.product.create({
      data: {
        sku: sku2,
        name: 'PTZ Security Camera',
        description: 'Pan-Tilt-Zoom 1080p camera with night vision',
        category: 'Security',
        price: 149.99,
        weight: 1.5,
        dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
        barcode: barcode2,
        reorderPoint: 20,
        reorderQuantity: 50,
        companyId: company.id
      }
    });

    const sku3 = generateBarcode();
    const barcode3 = generateBarcode();
    const product3 = await prisma.product.create({
      data: {
        sku: sku3,
        name: 'Smart Door Lock',
        description: 'Biometric smart lock with app control',
        category: 'Security',
        price: 89.99,
        weight: 2.0,
        dimensions: { length: 15, width: 10, height: 5, unit: 'cm' },
        barcode: barcode3,
        reorderPoint: 30,
        reorderQuantity: 50,
        companyId: company.id
      }
    });

    const sku4 = generateBarcode();
    const barcode4 = generateBarcode();
    const product4 = await prisma.product.create({
      data: {
        sku: sku4,
        name: 'Smart Hub WiFi',
        description: 'Central hub for all smart home devices',
        category: 'Automation',
        price: 59.99,
        weight: 0.8,
        dimensions: { length: 12, width: 8, height: 3, unit: 'cm' },
        barcode: barcode4,
        reorderPoint: 40,
        reorderQuantity: 80,
        companyId: company.id
      }
    });

    const sku5 = generateBarcode();
    const barcode5 = generateBarcode();
    const product5 = await prisma.product.create({
      data: {
        sku: sku5,
        name: 'Window Sensor',
        description: 'Magnetic contact sensor for windows',
        category: 'Security',
        price: 19.99,
        weight: 0.2,
        dimensions: { length: 8, width: 3, height: 2, unit: 'cm' },
        barcode: barcode5,
        reorderPoint: 100,
        reorderQuantity: 150,
        companyId: company.id
      }
    });

    // Create Orders with proper estimates and locations
    console.log('📋 Creating orders...');
    const order1 = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        customerName: 'Auckland Security',
        customerEmail: 'contact@aucklandsecurity.co.nz',
        customerPhone: '021-123-4567',
        status: 'PENDING',
        priority: 'URGENT',
        createdAt: new Date(),
        estimatedPickMinutes: generateEstimate(3),
        requiredBy: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days from now
        siteId: site.id,
        shippingAddress: { street: '456 Queen St', city: 'Auckland', postalCode: '1010', country: 'NZ' },
        items: {
          create: [
            { productId: product1.id, sku: product1.sku, name: product1.name, barcode: product1.barcode, quantity: 10, location: 'A-01-01-1' },
            { productId: product2.id, sku: product2.sku, name: product2.name, barcode: product2.barcode, quantity: 2, location: 'B-01-01-1' },
            { productId: product5.id, sku: product5.sku, name: product5.name, barcode: product5.barcode, quantity: 20, location: 'E-01-01-1' },
          ]
        }
      }
    });

    const order2 = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        customerName: 'Wellington Homes',
        customerEmail: 'orders@wellingtonhomes.co.nz',
        customerPhone: '027-987-6543',
        status: 'PENDING',
        priority: 'NORMAL',
        createdAt: new Date(),
        estimatedPickMinutes: generateEstimate(2),
        requiredBy: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        siteId: site.id,
        shippingAddress: { street: '789 Lambton Quay', city: 'Wellington', postalCode: '6011', country: 'NZ' },
        items: {
          create: [
            { productId: product3.id, sku: product3.sku, name: product3.name, barcode: product3.barcode, quantity: 5, location: 'C-01-01-1' },
            { productId: product4.id, sku: product4.sku, name: product4.name, barcode: product4.barcode, quantity: 2, location: 'D-01-01-1' },
          ]
        }
      }
    });

    const order3 = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        customerName: 'Christchurch Systems',
        customerEmail: 'sales@christchurchsystems.co.nz',
        customerPhone: '022-456-7890',
        status: 'PENDING',
        priority: 'LOW',
        createdAt: new Date(),
        estimatedPickMinutes: generateEstimate(2),
        requiredBy: new Date(Date.now() + (10 * 24 * 60 * 60 * 1000)), // 10 days from now
        siteId: site.id,
        shippingAddress: { street: '123 Cathedral Square', city: 'Christchurch', postalCode: '8011', country: 'NZ' },
        items: {
          create: [
            { productId: product1.id, sku: product1.sku, name: product1.name, barcode: product1.barcode, quantity: 25, location: 'A-01-01-2' },
            { productId: product5.id, sku: product5.sku, name: product5.name, barcode: product5.barcode, quantity: 50, location: 'E-01-01-2' },
          ]
        }
      }
    });

    const order4 = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        customerName: 'Dunedin Security',
        customerEmail: 'info@dunedinsecurity.co.nz',
        customerPhone: '023-789-0123',
        status: 'PICKING',
        priority: 'URGENT',
        createdAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)), // 1 day ago
        estimatedPickMinutes: generateEstimate(2),
        requiredBy: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // 2 days from now
        siteId: site.id,
        shippingAddress: { street: '456 George St', city: 'Dunedin', postalCode: '9016', country: 'NZ' },
        items: {
          create: [
            { productId: product2.id, sku: product2.sku, name: product2.name, barcode: product2.barcode, quantity: 5, location: 'B-01-01-2' },
            { productId: product3.id, sku: product3.sku, name: product3.name, barcode: product3.barcode, quantity: 10, location: 'C-01-01-2' },
          ]
        }
      }
    });

    const order5 = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        customerName: 'Hamilton Tech',
        customerEmail: 'orders@hamiltontech.co.nz',
        customerPhone: '024-567-8901',
        status: 'PACKED',
        priority: 'NORMAL',
        createdAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)), // 2 days ago
        estimatedPickMinutes: generateEstimate(2),
        requiredBy: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)), // 1 day ago
        packedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)), // 1 day ago
        siteId: site.id,
        shippingAddress: { street: '789 Victoria St', city: 'Hamilton', postalCode: '3204', country: 'NZ' },
        items: {
          create: [
            { productId: product1.id, sku: product1.sku, name: product1.name, barcode: product1.barcode, quantity: 15, location: 'A-01-01-3' },
            { productId: product4.id, sku: product4.sku, name: product4.name, barcode: product4.barcode, quantity: 8, location: 'D-01-01-3' },
          ]
        }
      }
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: 3`);
    console.log(`   Products: 5 (all with 12-digit SKUs/barcodes)`);
    console.log(`   Orders: 5 (all with estimatedPickMinutes)`);
    console.log('\n🔐 Login credentials:');
    console.log(`   Admin: admin@arrowhead.co.nz / password123`);
    console.log(`   Picker: picker@example.com / password123`);
    console.log(`   Packer: packer@example.com / password123`);
    console.log('\n📝 Sample SKU:', sku1, '(12 digits)');
    console.log('📝 Sample Barcode:', barcode1, '(12 digits)');

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