const http = require('http');

async function verifyOrders() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/orders',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const orders = JSON.parse(data);
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('🔍 Verifying orders from API...\n');
  
  try {
    const orders = await verifyOrders();
    
    console.log(`✅ Found ${orders.length} orders in the database\n`);
    
    if (orders.length === 0) {
      console.log('⚠️  No orders found. Orders may not have been created correctly.');
      return;
    }
    
    // Display sample order
    console.log('📋 Sample Order Details:');
    console.log('='.repeat(60));
    const sample = orders[0];
    console.log(`ID: ${sample.id}`);
    console.log(`Customer: ${sample.customerName}`);
    console.log(`Email: ${sample.customerEmail}`);
    console.log(`Phone: ${sample.customerPhone}`);
    console.log(`Status: ${sample.status}`);
    console.log(`Priority: ${sample.priority}`);
    console.log(`Created At: ${sample.createdAt}`);
    console.log(`Required By: ${sample.requiredBy}`);
    console.log(`Site ID: ${sample.siteId}`);
    console.log(`Shipping Address: ${JSON.stringify(sample.shippingAddress, null, 2)}`);
    console.log(`Items: ${sample.items?.length || 0}`);
    
    if (sample.items && sample.items.length > 0) {
      console.log('\n📦 Order Items:');
      sample.items.forEach((item, index) => {
        console.log(`\n  Item ${index + 1}:`);
        console.log(`    SKU: ${item.sku}`);
        console.log(`    Name: ${item.name}`);
        console.log(`    Quantity: ${item.quantity}`);
        console.log(`    Location: ${item.location}`);
      });
    }
    
    // Order status summary
    const statusCounts = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('\n📊 Order Status Summary:');
    console.log('='.repeat(60));
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check for date/time issues
    console.log('\n⏰ Date/Time Verification:');
    console.log('='.repeat(60));
    orders.forEach((order, index) => {
      const createdDate = new Date(order.createdAt);
      const requiredDate = new Date(order.requiredBy);
      
      const createdValid = !isNaN(createdDate.getTime());
      const requiredValid = !isNaN(requiredDate.getTime());
      
      console.log(`Order ${index + 1} (${order.customerName}):`);
      console.log(`  Created At: ${order.createdAt}`);
      console.log(`  Valid: ${createdValid ? '✅' : '❌'}`);
      console.log(`  Required By: ${order.requiredBy}`);
      console.log(`  Valid: ${requiredValid ? '✅' : '❌'}`);
      
      if (createdValid && requiredValid) {
        const hoursUntilDue = Math.round((requiredDate - createdDate) / (1000 * 60 * 60));
        console.log(`  Hours until due: ${hoursUntilDue}`);
      }
      console.log('');
    });
    
    console.log('\n✨ Orders API verification complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open the frontend application');
    console.log('   2. Navigate to the Dashboard');
    console.log('   3. Verify orders appear with correct dates');
    console.log('   4. Check the Picking, Packing, and Shipping pages');
    
  } catch (error) {
    console.error('❌ Error verifying orders:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3001');
  }
}

run();