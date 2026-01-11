// Load environment variables
require('dotenv').config({ path: './.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a valid 12-digit barcode/SKU
 * @returns {string} - 12-digit numeric string
 */
function generateValidBarcode() {
  return Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, '0');
}

/**
 * Validate if a barcode is a valid 12-digit numeric string
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidBarcode(barcode) {
  if (!barcode) return false;
  return /^\d{12}$/.test(barcode);
}

async function fixBarcodes() {
  console.log('🔧 Starting barcode fix process...\n');

  try {
    // Get all products
    console.log('📦 Fetching all products...');
    const products = await prisma.product.findMany({
      include: {
        company: true
      }
    });

    console.log(`\nFound ${products.length} products in database.\n`);

    let fixedCount = 0;
    let alreadyValidCount = 0;
    const updates = [];

    // Check each product's barcode
    for (const product of products) {
      const hasValidBarcode = isValidBarcode(product.barcode);
      const hasValidSku = isValidBarcode(product.sku);

      if (!hasValidBarcode || !hasValidSku) {
        const newBarcode = hasValidBarcode ? product.barcode : generateValidBarcode();
        const newSku = hasValidSku ? product.sku : generateValidBarcode();

        updates.push({
          id: product.id,
          name: product.name,
          oldBarcode: product.barcode,
          newBarcode: newBarcode,
          oldSku: product.sku,
          newSku: newSku
        });

        fixedCount++;
      } else {
        alreadyValidCount++;
      }
    }

    // Display what needs to be fixed
    if (updates.length > 0) {
      console.log('🔍 Products requiring barcode/SKU fixes:\n');
      updates.forEach((update, index) => {
        console.log(`${index + 1}. ${update.name}`);
        if (update.oldBarcode !== update.newBarcode) {
          console.log(`   Barcode: ${update.oldBarcode || 'NULL'} → ${update.newBarcode}`);
        }
        if (update.oldSku !== update.newSku) {
          console.log(`   SKU: ${update.oldSku || 'NULL'} → ${update.newSku}`);
        }
        console.log('');
      });
    }

    console.log('📊 Summary:');
    console.log(`   Products with valid barcodes/SKUs: ${alreadyValidCount}`);
    console.log(`   Products requiring fixes: ${updates.length}`);
    console.log('');

    // Apply fixes
    if (updates.length > 0) {
      console.log('⚙️ Applying fixes...');
      
      for (const update of updates) {
        await prisma.product.update({
          where: { id: update.id },
          data: {
            barcode: update.newBarcode,
            sku: update.newSku
          }
        });
        console.log(`   ✓ Fixed: ${update.name}`);
      }

      console.log('');
    }

    // Verify fixes
    console.log('✅ Verifying all barcodes...');
    const allProducts = await prisma.product.findMany();
    const invalidCount = allProducts.filter(p => !isValidBarcode(p.barcode) || !isValidBarcode(p.sku)).length;

    if (invalidCount === 0) {
      console.log('✨ All products now have valid 12-digit barcodes and SKUs!');
      console.log('\n📋 Sample products:');
      const sampleProducts = allProducts.slice(0, 3);
      sampleProducts.forEach(product => {
        console.log(`   ${product.name}`);
        console.log(`     SKU: ${product.sku} (12 digits)`);
        console.log(`     Barcode: ${product.barcode} (12 digits)`);
      });
    } else {
      console.log(`⚠️  Warning: ${invalidCount} products still have invalid barcodes/SKUs`);
    }

  } catch (error) {
    console.error('❌ Error fixing barcodes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixBarcodes()
  .then(() => {
    console.log('\n✨ Barcode fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Barcode fix failed:', error);
    process.exit(1);
  });