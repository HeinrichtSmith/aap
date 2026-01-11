// Set DATABASE_URL to match backend configuration
process.env.DATABASE_URL = 'file:./dev.db';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestOrders() {
  console.log('🌱 Adding test orders to database...');

  try {
    // Check if we have necessary data
    console.log('🔍 Checking for existing companies and sites...');
    
    // Get or create a company
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Test Company',
          plan: 'ELITE',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Created test company');
    }

    // Get or create a site
    let site = await prisma.site.findFirst({ where: { companyId: company.id } });
    if (!site) {
      site = await prisma.site.create({
        data: {
          companyId: company.id,
          code: 'SITE-001',
          name: 'Main Warehouse',
          address: {
            street: '123 Warehouse St',
            city: 'Auckland',
            country: 'New Zealand',
            postalCode: '1010'
          }
        }
      });
      console.log('✅ Created test site');
    }

    // Get or create users
    let picker = await prisma.user.findFirst({ where: { role: 'PICKER' } });
    if (!picker) {
      picker = await prisma.user.create({
        data: {
          email: 'picker@example.com',
          password: 'password123',
          name: 'John Picker',
          role: 'PICKER',
          department: 'Warehouse',
          companyId: company.id,
          siteId: site.id
        }
      });
      console.log('✅ Created picker user');
    }

    let packer = await prisma.user.findFirst({ where: { role: 'PACKER' } });
    if (!packer) {
      packer = await prisma.user.create({
        data: {
          email: 'packer@example.com',
          password: 'password123',
          name: 'Sarah Packer',
          role: 'PACKER',
          department: 'Warehouse',
          companyId: company.id,
          siteId: site.id
        }
      });
      console.log('✅ Created packer user');
    }

    // Get or create products
    console.log('🔍 Checking for existing products...');
    let products = await prisma.product.findMany();
    
    if (products.length === 0) {
      console.log('📦 Creating products...');
      const productData = [
        {
          companyId: company.id,
          siteId: site.id,
          sku: 'PIR-SENS-001',
          name: 'PIR Motion Sensor',
          description: 'High-sensitivity motion detector for security systems',
          category: 'Security',
          price: 29.99,
          weight: 0.2,
          dimensions: { length: 10, width: 5, height: 3, unit: 'cm' },
          barcode: '9780132350884',
          reorderPoint: 50,
          reorderQuantity: 100,
          supplier: 'TechSupply Co.'
        },
        {
          companyId: company.id,
          siteId: site.id,
          sku: 'CAM-PTZ-002',
          name: 'PTZ Security Camera',
          description: 'Pan-Tilt-Zoom 1080p camera with night vision',
          category: 'Security',
          price: 149.99,
          weight: 1.5,
          dimensions: { length: 15, width: 10, height: 10, unit: 'cm' },
          barcode: '9780132350885',
          reorderPoint: 20,
          reorderQuantity: 50,
          supplier: 'TechSupply Co.'
        },
        {
          companyId: company.id,
          siteId: site.id,
          sku: 'DOO-LOCK-003',
          name: 'Smart Door Lock',
          description: 'Biometric smart lock with app control',
          category: 'Security',
          price: 89.99,
          weight: 2.0,
          dimensions: { length: 12, width: 8, height: 4, unit: 'cm' },
          barcode: '9780132350886',
          reorderPoint: 30,
          reorderQuantity: 50,
          supplier: 'SecureHome Inc.'
        },
        {
          companyId: company.id,
          siteId: site.id,
          sku: 'HUB-WIFI-004',
          name: 'Smart Hub WiFi',
          description: 'Central hub for all smart home devices',
          category: 'Automation',
          price: 59.99,
          weight: 0.5,
          dimensions: { length: 8, width: 8, height: 2, unit: 'cm' },
          barcode: '9780132350887',
          reorderPoint: 40,
          reorderQuantity: 80,
          supplier: 'TechSupply Co.'
        },
        {
          companyId: company.id,
          siteId: site.id,
          sku: 'SEN-WIND-005',
          name: 'Window Sensor',
          description: 'Magnetic contact sensor for windows',
          category: 'Security',
          price: 19.99,
          weight: 0.1,
          dimensions: { length: 5, width: 3, height: 1, unit: 'cm' },
          barcode: '9780132350888',
          reorderPoint: 100,
          reorderQuantity: 150,
          supplier: 'SecureHome Inc.'
        }
      ];

      for (const pData of productData) {
        const product = await prisma.product.create({ data: pData });
        products.push(product);
      }
      console.log('✅ Created 5 products');
    }

    // Create bins if they don't exist
    console.log('🔍 Checking for existing bins...');
    let bins = await prisma.bin.findMany({ where: { companyId: company.id } });
    
    if (bins.length === 0) {
      console.log('📦 Creating bins...');
      const binData = [
        { companyId: company.id, code: 'BIN-001', location: 'A-01-01', aisle: 'A', row: '01', column: '01', capacity: 100, type: 'small' },
        { companyId: company.id, code: 'BIN-002', location: 'A-01-02', aisle: 'A', row: '01', column: '02', capacity: 100, type: 'small' },
        { companyId: company.id, code: 'BIN-003', location: 'A-01-03', aisle: 'A', row: '01', column: '03', capacity: 100, type: 'small' },
        { companyId: company.id, code: 'BIN-004', location: 'B-01-01', aisle: 'B', row: '01', column: '01', capacity: 50, type: 'medium' },
        { companyId: company.id, code: 'BIN-005', location: 'B-01-02', aisle: 'B', row: '01', column: '02', capacity: 50, type: 'medium' },
        { companyId: company.id, code: 'BIN-006', location: 'C-01-01', aisle: 'C', row: '01', column: '01', capacity: 80, type: 'medium' },
        { companyId: company.id, code: 'BIN-007', location: 'C-01-02', aisle: 'C', row: '01', column: '02', capacity: 80, type: 'medium' },
        { companyId: company.id, code: 'BIN-008', location: 'D-01-01', aisle: 'D', row: '01', column: '01', capacity: 120, type: 'large' },
        { companyId: company.id, code: 'BIN-009', location: 'D-01-02', aisle: 'D', row: '01', column: '02', capacity: 120, type: 'large' },
        { companyId: company.id, code: 'BIN-010', location: 'E-01-01', aisle: 'E', row: '01', column: '01', capacity: 200, type: 'large' },
        { companyId: company.id, code: 'BIN-011', location: 'E-01-02', aisle: 'E', row: '01', column: '02', capacity: 200, type: 'large' },
      ];

      for (const bData of binData) {
        const bin = await prisma.bin.create({ data: bData });
        bins.push(bin);
      }
      console.log('✅ Created 11 bins');
    }

    // Create inventory items
    console.log('🔍 Checking for existing inventory items...');
    const existingInventory = await prisma.inventoryItem.count();
    
    if (existingInventory === 0) {
      console.log('📊 Creating inventory items...');
      const inventoryData = [
        { productId: products[0].id, binId: bins[0].id, siteId: site.id, quantity: 50, quantityAvailable: 50 },
        { productId: products[0].id, binId: bins[1].id, siteId: site.id, quantity: 50, quantityAvailable: 50 },
        { productId: products[0].id, binId: bins[2].id, siteId: site.id, quantity: 50, quantityAvailable: 50 },
        { productId: products[1].id, binId: bins[3].id, siteId: site.id, quantity: 30, quantityAvailable: 30 },
        { productId: products[1].id, binId: bins[4].id, siteId: site.id, quantity: 15, quantityAvailable: 15 },
        { productId: products[2].id, binId: bins[5].id, siteId: site.id, quantity: 40, quantityAvailable: 40 },
        { productId: products[2].id, binId: bins[6].id, siteId: site.id, quantity: 40, quantityAvailable: 40 },
        { productId: products[3].id, binId: bins[7].id, siteId: site.id, quantity: 60, quantityAvailable: 60 },
        { productId: products[3].id, binId: bins[8].id, siteId: site.id, quantity: 60, quantityAvailable: 60 },
        { productId: products[4].id, binId: bins[9].id, siteId: site.id, quantity: 100, quantityAvailable: 100 },
        { productId: products[4].id, binId: bins[10].id, siteId: site.id, quantity: 100, quantityAvailable: 100 },
      ];

      await prisma.inventoryItem.createMany({ data: inventoryData });
      console.log('✅ Created 11 inventory items');
    }

    // Create Orders
    console.log('📋 Creating test orders...');
    
    const order1 = await prisma.order.create({
      data: {
        id: 'ORD-2025-001',
        customerName: 'Auckland Security',
        customerEmail: 'contact@aucklandsecurity.co.nz',
        customerPhone: '+64 9 555 0101',
        status: 'PENDING',
        priority: 'NORMAL',
        siteId: site.id,
        shippingAddress: {
          street: '45 Queen Street',
          city: 'Auckland',
          country: 'New Zealand',
          postalCode: '1010'
        },
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        items: {
          create: [
            {
              productId: products[0].id,
              sku: products[0].sku,
              name: products[0].name,
              barcode: products[0].barcode,
              quantity: 10,
              location: bins[0].location
            },
            {
              productId: products[1].id,
              sku: products[1].sku,
              name: products[1].name,
              barcode: products[1].barcode,
              quantity: 2,
              location: bins[3].location
            },
            {
              productId: products[4].id,
              sku: products[4].sku,
              name: products[4].name,
              barcode: products[4].barcode,
              quantity: 20,
              location: bins[9].location
            }
          ]
        }
      }
    });

    const order2 = await prisma.order.create({
      data: {
        id: 'ORD-2025-002',
        customerName: 'Wellington Homes',
        customerEmail: 'orders@wellingtonhomes.co.nz',
        customerPhone: '+64 4 555 0202',
        status: 'PICKING',
        priority: 'NORMAL',
        siteId: site.id,
        shippingAddress: {
          street: '78 Lambton Quay',
          city: 'Wellington',
          country: 'New Zealand',
          postalCode: '6011'
        },
        requiredBy: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assignedPickerId: picker.id,
        items: {
          create: [
            {
              productId: products[2].id,
              sku: products[2].sku,
              name: products[2].name,
              barcode: products[2].barcode,
              quantity: 5,
              location: bins[5].location,
              pickedQuantity: 3
            },
            {
              productId: products[3].id,
              sku: products[3].sku,
              name: products[3].name,
              barcode: products[3].barcode,
              quantity: 2,
              location: bins[7].location,
              pickedQuantity: 2
            }
          ]
        }
      }
    });

    const order3 = await prisma.order.create({
      data: {
        id: 'ORD-2025-003',
        customerName: 'Christchurch Systems',
        customerEmail: 'purchasing@christchurchsystems.co.nz',
        customerPhone: '+64 3 555 0303',
        status: 'READY_TO_PACK',
        priority: 'LOW',
        siteId: site.id,
        shippingAddress: {
          street: '23 Cathedral Square',
          city: 'Christchurch',
          country: 'New Zealand',
          postalCode: '8011'
        },
        requiredBy: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        assignedPickerId: picker.id,
        items: {
          create: [
            {
              productId: products[0].id,
              sku: products[0].sku,
              name: products[0].name,
              barcode: products[0].barcode,
              quantity: 25,
              location: bins[1].location,
              pickedQuantity: 25
            },
            {
              productId: products[4].id,
              sku: products[4].sku,
              name: products[4].name,
              barcode: products[4].barcode,
              quantity: 50,
              location: bins[10].location,
              pickedQuantity: 50
            }
          ]
        }
      }
    });

    const order4 = await prisma.order.create({
      data: {
        id: 'ORD-2025-004',
        customerName: 'Dunedin Security',
        customerEmail: 'orders@dunedinsecurity.co.nz',
        customerPhone: '+64 3 555 0404',
        status: 'PACKED',
        priority: 'URGENT',
        siteId: site.id,
        shippingAddress: {
          street: '56 George Street',
          city: 'Dunedin',
          country: 'New Zealand',
          postalCode: '9016'
        },
        requiredBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assignedPickerId: picker.id,
        assignedPackerId: packer.id,
        packedAt: new Date(),
        packageType: 'Standard Box',
        trackingNumber: 'NZ-2025-004-TRK',
        items: {
          create: [
            {
              productId: products[1].id,
              sku: products[1].sku,
              name: products[1].name,
              barcode: products[1].barcode,
              quantity: 5,
              location: bins[3].location,
              pickedQuantity: 5,
              packedQuantity: 5
            },
            {
              productId: products[2].id,
              sku: products[2].sku,
              name: products[2].name,
              barcode: products[2].barcode,
              quantity: 10,
              location: bins[5].location,
              pickedQuantity: 10,
              packedQuantity: 10
            }
          ]
        }
      }
    });

    const order5 = await prisma.order.create({
      data: {
        id: 'ORD-2025-005',
        customerName: 'Hamilton Tech',
        customerEmail: 'procurement@hamiltontech.co.nz',
        customerPhone: '+64 7 555 0505',
        status: 'SHIPPED',
        priority: 'NORMAL',
        siteId: site.id,
        shippingAddress: {
          street: '89 Victoria Street',
          city: 'Hamilton',
          country: 'New Zealand',
          postalCode: '3204'
        },
        requiredBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        assignedPickerId: picker.id,
        assignedPackerId: packer.id,
        packedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        shippedAt: new Date(),
        packageType: 'Large Box',
        trackingNumber: 'NZ-2025-005-TRK',
        items: {
          create: [
            {
              productId: products[0].id,
              sku: products[0].sku,
              name: products[0].name,
              barcode: products[0].barcode,
              quantity: 15,
              location: bins[2].location,
              pickedQuantity: 15,
              packedQuantity: 15
            },
            {
              productId: products[3].id,
              sku: products[3].sku,
              name: products[3].name,
              barcode: products[3].barcode,
              quantity: 8,
              location: bins[8].location,
              pickedQuantity: 8,
              packedQuantity: 8
            }
          ]
        }
      }
    });

    // Additional test orders for variety
    const order6 = await prisma.order.create({
      data: {
        id: 'ORD-2025-006',
        customerName: 'Tauranga Electronics',
        customerEmail: 'sales@taurangaelectronics.co.nz',
        customerPhone: '+64 7 555 0606',
        status: 'PENDING',
        priority: 'OVERNIGHT',
        siteId: site.id,
        shippingAddress: {
          street: '12 Devonport Road',
          city: 'Tauranga',
          country: 'New Zealand',
          postalCode: '3110'
        },
        requiredBy: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        items: {
          create: [
            {
              productId: products[0].id,
              sku: products[0].sku,
              name: products[0].name,
              barcode: products[0].barcode,
              quantity: 30,
              location: bins[0].location
            },
            {
              productId: products[1].id,
              sku: products[1].sku,
              name: products[1].name,
              barcode: products[1].barcode,
              quantity: 3,
              location: bins[3].location
            }
          ]
        }
      }
    });

    const order7 = await prisma.order.create({
      data: {
        id: 'ORD-2025-007',
        customerName: 'Palmerston North Retail',
        customerEmail: 'orders@pncentralretail.co.nz',
        customerPhone: '+64 6 555 0707',
        status: 'PENDING',
        priority: 'LOW',
        siteId: site.id,
        shippingAddress: {
          street: '34 The Square',
          city: 'Palmerston North',
          country: 'New Zealand',
          postalCode: '4410'
        },
        requiredBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        items: {
          create: [
            {
              productId: products[2].id,
              sku: products[2].sku,
              name: products[2].name,
              barcode: products[2].barcode,
              quantity: 8,
              location: bins[6].location
            },
            {
              productId: products[3].id,
              sku: products[3].sku,
              name: products[3].name,
              barcode: products[3].barcode,
              quantity: 4,
              location: bins[7].location
            },
            {
              productId: products[4].id,
              sku: products[4].sku,
              name: products[4].name,
              barcode: products[4].barcode,
              quantity: 25,
              location: bins[9].location
            }
          ]
        }
      }
    });

    const order8 = await prisma.order.create({
      data: {
        id: 'ORD-2025-008',
        customerName: 'Napier Distributors',
        customerEmail: 'info@napierdistributors.co.nz',
        customerPhone: '+64 6 555 0808',
        status: 'PICKING',
        priority: 'URGENT',
        siteId: site.id,
        shippingAddress: {
          street: '67 Emerson Street',
          city: 'Napier',
          country: 'New Zealand',
          postalCode: '4140'
        },
        requiredBy: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        assignedPickerId: picker.id,
        items: {
          create: [
            {
              productId: products[1].id,
              sku: products[1].sku,
              name: products[1].name,
              barcode: products[1].barcode,
              quantity: 7,
              location: bins[4].location,
              pickedQuantity: 4
            },
            {
              productId: products[2].id,
              sku: products[2].sku,
              name: products[2].name,
              barcode: products[2].barcode,
              quantity: 12,
              location: bins[6].location,
              pickedQuantity: 6
            }
          ]
        }
      }
    });

    console.log('\n✅ Test orders added successfully!');
    console.log('\n📊 Orders Created:');
    console.log(`   1. ORD-2025-001 - Auckland Security (PENDING, NORMAL)`);
    console.log(`   2. ORD-2025-002 - Wellington Homes (PICKING, NORMAL)`);
    console.log(`   3. ORD-2025-003 - Christchurch Systems (READY_TO_PACK, LOW)`);
    console.log(`   4. ORD-2025-004 - Dunedin Security (PACKED, URGENT)`);
    console.log(`   5. ORD-2025-005 - Hamilton Tech (SHIPPED, NORMAL)`);
    console.log(`   6. ORD-2025-006 - Tauranga Electronics (PENDING, OVERNIGHT)`);
    console.log(`   7. ORD-2025-007 - Palmerston North Retail (PENDING, LOW)`);
    console.log(`   8. ORD-2025-008 - Napier Distributors (PICKING, URGENT)`);
    console.log('\n✨ Total: 8 test orders with various statuses and priorities');

  } catch (error) {
    console.error('❌ Error adding test orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTestOrders()
  .then(() => {
    console.log('\n✨ Operation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  });
