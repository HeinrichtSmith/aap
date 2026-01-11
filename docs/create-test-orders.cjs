const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createTestOrders() {
  const prisma = new PrismaClient();
  
  try {
    // Get existing products
    const products = await prisma.product.findMany();
    const site = await prisma.site.findFirst();
    
    if (products.length === 0) {
      console.log('❌ No products found. Please seed the database first.');
      return;
    }
    
    if (!site) {
      console.log('❌ No site found. Please seed the database first.');
      return;
    }
    
    // Create 5 more test orders with different statuses
    const orders = [
      {
        id: crypto.randomUUID(),
        customerName: 'Tech Solutions Ltd',
        customerEmail: 'orders@techsolutions.nz',
        customerPhone: '021-555-1234',
        status: 'PENDING',
        priority: 'URGENT',
        requiredBy: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)), // 1 day
        siteId: site.id,
        shippingAddress: { street: '100 Tech Park', city: 'Auckland', postalCode: '1010', country: 'NZ' },
        items: {
          create: [
            { productId: products[0].id, sku: products[0].sku, name: products[0].name, barcode: products[0].barcode, quantity: 5, location: 'A-01-02' },
            { productId: products[1].id, sku: products[1].sku, name: products[1].name, barcode: products[1].barcode, quantity: 3, location: 'B-01-02' }
          ]
        }
      },
      {
        id: crypto.randomUUID(),
        customerName: 'Security Plus',
        customerEmail: 'sales@securityplus.co.nz',
        customerPhone: '022-555-9876',
        status: 'PENDING',
        priority: 'NORMAL',
        requiredBy: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days
        siteId: site.id,
        shippingAddress: { street: '200 Safety Road', city: 'Wellington', postalCode: '6011', country: 'NZ' },
        items: {
          create: [
            { productId: products[2].id, sku: products[2].sku, name: products[2].name, barcode: products[2].barcode, quantity: 8, location: 'C-01-02' },
            { productId: products[3].id, sku: products[3].sku, name: products[3].name, barcode: products[3].barcode, quantity: 4, location: 'D-01-02' }
          ]
        }
      },
      {
        id: crypto.randomUUID(),
        customerName: 'Home Automation NZ',
        customerEmail: 'info@homeautomation.nz',
        customerPhone: '023-555-4567',
        status: 'PENDING',
        priority: 'NORMAL',
        requiredBy: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)), // 5 days
        siteId: site.id,
        shippingAddress: { street: '300 Smart Street', city: 'Christchurch', postalCode: '8011', country: 'NZ' },
        items: {
          create: [
            { productId: products[3].id, sku: products[3].sku, name: products[3].name, barcode: products[3].barcode, quantity: 6, location: 'D-01-03' },
            { productId: products[4].id, sku: products[4].sku, name: products[4].name, barcode: products[4].barcode, quantity: 15, location: 'E-01-02' }
          ]
        }
      },
      {
        id: crypto.randomUUID(),
        customerName: 'Retail Giant',
        customerEmail: 'purchasing@retailgiant.co.nz',
        customerPhone: '024-555-7890',
        status: 'PENDING',
        priority: 'LOW',
        requiredBy: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        siteId: site.id,
        shippingAddress: { street: '400 Mall Ave', city: 'Hamilton', postalCode: '3204', country: 'NZ' },
        items: {
          create: [
            { productId: products[0].id, sku: products[0].sku, name: products[0].name, barcode: products[0].barcode, quantity: 20, location: 'A-01-03' },
            { productId: products[2].id, sku: products[2].sku, name: products[2].name, barcode: products[2].barcode, quantity: 10, location: 'C-01-03' }
          ]
        }
      },
      {
        id: crypto.randomUUID(),
        customerName: 'Express Security',
        customerEmail: 'urgent@expresssecurity.nz',
        customerPhone: '021-555-1111',
        status: 'PENDING',
        priority: 'URGENT',
        requiredBy: new Date(Date.now() + (12 * 60 * 60 * 1000)), // 12 hours
        siteId: site.id,
        shippingAddress: { street: '500 Express Way', city: 'Auckland', postalCode: '1020', country: 'NZ' },
        items: {
          create: [
            { productId: products[1].id, sku: products[1].sku, name: products[1].name, barcode: products[1].barcode, quantity: 1, location: 'B-01-03' },
            { productId: products[4].id, sku: products[4].sku, name: products[4].name, barcode: products[4].barcode, quantity: 25, location: 'E-01-03' }
          ]
        }
      }
    ];
    
    // Create orders
    console.log('📋 Creating 5 new test orders...');
    for (const order of orders) {
      await prisma.order.create({
        data: order
      });
      console.log(`✅ Created order for ${order.customerName}`);
    }
    
    console.log('\n🎉 All test orders created successfully!');
    console.log(`\n📊 Total orders in database: ${await prisma.order.count()}`);
    
    // Show order summary
    const orderCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('\n📈 Order Status Summary:');
    orderCounts.forEach(item => {
      console.log(`   ${item.status}: ${item._count}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrders();