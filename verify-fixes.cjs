const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFixes() {
  console.log('✅ DATABASE FIX VERIFICATION\n');
  
  try {
    const orders = await prisma.order.findMany({ 
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Total Orders: ${orders.length}\n`);
    
    let allPass = true;
    
    orders.forEach((order, idx) => {
      console.log(`Order ${idx + 1}: ${order.orderId || order.id}`);
      
      // Check 1: estimatedPickMinutes
      if (order.estimatedPickMinutes && order.estimatedPickMinutes > 0) {
        console.log(`  ✅ estimatedPickMinutes: ${order.estimatedPickMinutes} minutes`);
      } else {
        console.log(`  ❌ estimatedPickMinutes: MISSING or INVALID`);
        allPass = false;
      }
      
      // Check 2: Item SKUs and locations
      console.log(`  📦 Items: ${order.items.length}`);
      order.items.forEach(item => {
        // Check SKU format (should be 12-13 digits)
        const skuValid = /^\d{12,13}$/.test(item.sku);
        if (skuValid) {
          console.log(`    ✅ ${item.name}: sku=${item.sku} (12-13 digits)`);
        } else {
          console.log(`    ❌ ${item.name}: sku=${item.sku} (INVALID FORMAT)`);
          allPass = false;
        }
        
        // Check location
        if (item.location && typeof item.location === 'string') {
          console.log(`       location: ${item.location}`);
        } else {
          console.log(`       ❌ location: MISSING`);
          allPass = false;
        }
      });
      
      console.log('');
    });
    
    console.log('\n' + '='.repeat(50));
    if (allPass) {
      console.log('✅ ALL VERIFICATIONS PASSED!');
      console.log('   - EST values are present and valid');
      console.log('   - SKUs are 12-13 digit numbers');
      console.log('   - Bin locations are present');
    } else {
      console.log('❌ SOME VERIFICATIONS FAILED!');
      console.log('   Check the errors above for details');
    }
    console.log('='.repeat(50));
    
    return allPass;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

verifyFixes();