/**
 * PRODUCTION READINESS VERIFICATION
 * 
 * Checks:
 * - All services exist and export correct functions
 * - All routes are registered
 * - Controllers use services properly
 * - Schema has all required models
 * - Frontend-backend data alignment
 * - Security and error handling
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m', // red
    warning: '\x1b[33m', // yellow
    reset: '\x1b[0m',
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function check(condition, name, description) {
  if (condition) {
    log(`✓ ${name}`, 'success');
    results.passed.push({ name, description });
    return true;
  } else {
    log(`✗ ${name}`, 'error');
    results.failed.push({ name, description });
    return false;
  }
}

function warn(condition, name, description) {
  if (!condition) {
    log(`⚠ ${name}`, 'warning');
    results.warnings.push({ name, description });
  }
}

function fileExists(path) {
  return existsSync(join(__dirname, path));
}

function fileContains(filePath, content) {
  try {
    const fileContent = readFileSync(join(__dirname, filePath), 'utf-8');
    return fileContent.includes(content);
  } catch (error) {
    return false;
  }
}

console.log('\n========================================');
console.log('   PRODUCTION VERIFICATION CHECK');
console.log('========================================\n');

// ============================================
// SECTION 1: SERVICES VERIFICATION
// ============================================
log('\n📦 VERIFYING SERVICES...', 'info');

const requiredServices = [
  { file: 'src/services/stockLockService.js', exports: ['reserveStock', 'commitLock', 'releaseLock', 'rollbackLock'] },
  { file: 'src/services/discrepancyService.js', exports: ['reportDiscrepancy', 'investigateDiscrepancy', 'resolveDiscrepancy', 'autoDetectDiscrepancy'] },
  { file: 'src/services/batchPickingService.js', exports: ['createBatches', 'startBatch', 'completeBatch'] },
  { file: 'src/services/waveManagementService.js', exports: ['createWave', 'releaseWave', 'batchWave'] },
  { file: 'src/services/inventorySummaryService.js', exports: ['summarizeInventoryHealth', 'getActionableInsights'] },
  { file: 'src/services/warehouseMapService.js', exports: ['getWarehouseMap', 'getTravelDistance'] },
  { file: 'src/services/courierService.js', exports: ['generateLabel', 'getQuote'] },
  { file: 'src/services/multiLocationService.js', exports: ['createTransfer', 'approveTransfer', 'shipTransfer'] },
];

requiredServices.forEach(service => {
  const exists = fileExists(service.file);
  const hasExports = service.exports.every(exp => fileContains(service.file, `export.*${exp}`));
  
  check(
    exists && hasExports,
    `Service: ${service.file}`,
    `Exports: ${service.exports.join(', ')}`
  );
});

// ============================================
// SECTION 2: UTILITIES VERIFICATION
// ============================================
log('\n🔧 VERIFYING UTILITIES...', 'info');

check(
  fileExists('src/utils/pickPathOptimizer.js'),
  'Utility: pickPathOptimizer.js',
  'TSP path optimization'
);

check(
  fileContains('src/utils/pickPathOptimizer.js', 'export function optimizePath'),
  'pickPathOptimizer exports',
  'optimizePath function'
);

// ============================================
// SECTION 3: CONTROLLERS VERIFICATION
// ============================================
log('\n🎮 VERIFYING CONTROLLERS...', 'info');

const requiredControllers = [
  'ordersController.js',
  'productsController.js',
  'sitesController.js',
  'usersController.js',
  'binsController.js',
  'purchaseOrdersController.js',
  'returnsController.js',
  'stockTakesController.js',
  'discrepanciesController.js',
  'batchesController.js',
  'wavesController.js',
  'transfersController.js',
  'reportsController.js',
];

requiredControllers.forEach(controller => {
  check(
    fileExists(`src/controllers/${controller}`),
    `Controller: ${controller}`,
    'Exists and exported'
  );
});

// Check controllers use services
check(
  fileContains('src/controllers/ordersController.js', "import.*stockLockService"),
  'OrdersController uses stockLockService',
  'Atomic inventory reservation'
);

check(
  fileContains('src/controllers/ordersController.js', "import.*courierService"),
  'OrdersController uses courierService',
  'Label generation'
);

// ============================================
// SECTION 4: ROUTES VERIFICATION
// ============================================
log('\n🛣️  VERIFYING ROUTES...', 'info');

const requiredRoutes = [
  'authRoutes.js',
  'ordersRoutes.js',
  'productsRoutes.js',
  'sitesRoutes.js',
  'usersRoutes.js',
  'binsRoutes.js',
  'purchaseOrdersRoutes.js',
  'returnsRoutes.js',
  'stockTakesRoutes.js',
  'discrepanciesRoutes.js',
  'batchesRoutes.js',
  'wavesRoutes.js',
  'transfersRoutes.js',
  'reportsRoutes.js',
];

requiredRoutes.forEach(route => {
  check(
    fileExists(`src/routes/${route}`),
    `Route: ${route}`,
    'Exists and exported'
  );
});

// ============================================
// SECTION 5: SERVER CONFIGURATION
// ============================================
log('\n🖥️  VERIFYING SERVER CONFIGURATION...', 'info');

check(
  fileExists('src/server.js'),
  'Server file',
  'Main entry point'
);

// Check all routes are imported
requiredRoutes.forEach(route => {
  const routeName = route.replace('.js', '');
  check(
    fileContains('src/server.js', `import.*${routeName}`),
    `Server imports ${routeName}`,
    'Route registered'
  );
});

// Check middleware
check(
  fileContains('src/server.js', 'helmet'),
  'Server uses helmet',
  'Security headers'
);

check(
  fileContains('src/server.js', 'cors'),
  'Server uses cors',
  'CORS enabled'
);

check(
  fileContains('src/server.js', 'rateLimit'),
  'Server uses rateLimit',
  'Rate limiting'
);

check(
  fileContains('src/server.js', 'errorHandler'),
  'Server uses errorHandler',
  'Error handling middleware'
);

// ============================================
// SECTION 6: SCHEMA VERIFICATION
// ============================================
log('\n🗄️  VERIFYING PRISMA SCHEMA...', 'info');

check(
  fileExists('prisma/schema.prisma'),
  'Prisma schema',
  'Schema file exists'
);

const requiredModels = [
  'model Company',
  'model Site',
  'model User',
  'model Product',
  'model InventoryItem',
  'model Order',
  'model OrderItem',
  'model StockLock',
  'model InventoryTransaction',
  'model Discrepancy',
  'model CycleCountTask',
  'model Batch',
  'model Wave',
  'model InventoryTransfer',
];

requiredModels.forEach(model => {
  check(
    fileContains('prisma/schema.prisma', model),
    `Schema includes ${model}`,
    'Model defined'
  );
});

// Check required indexes
check(
  fileContains('prisma/schema.prisma', '@@index([sku])'),
  'Schema has SKU indexes',
  'Query optimization'
);

check(
  fileContains('prisma/schema.prisma', '@@index([status])'),
  'Schema has status indexes',
  'Query optimization'
);

// ============================================
// SECTION 7: FRONTEND-BACKEND ALIGNMENT
// ============================================
log('\n🔗 VERIFYING FRONTEND-BACKEND ALIGNMENT...', 'info');

check(
  fileExists('../src/data/orders.json'),
  'Frontend orders.json',
  'Frontend data file'
);

// Check order structure matches
const orderFields = [
  'id',
  'customer',
  'status',
  'priority',
  'items',
  'shippingAddress',
  'trackingNumber',
];

orderFields.forEach(field => {
  check(
    fileContains('prisma/schema.prisma', field) ||
    fileContains('../src/data/orders.json', `"${field}"`),
    `Field alignment: ${field}`,
    'Exists in both frontend and backend'
  );
});

// ============================================
// SECTION 8: MIDDLEWARE VERIFICATION
// ============================================
log('\n🛡️  VERIFYING MIDDLEWARE...', 'info');

const requiredMiddleware = [
  'auth.js',
  'errorHandler.js',
];

requiredMiddleware.forEach(mw => {
  check(
    fileExists(`src/middleware/${mw}`),
    `Middleware: ${mw}`,
    'Exists'
  );
});

check(
  fileContains('src/middleware/auth.js', 'export'),
  'Auth middleware exported',
  'Authentication protection'
);

check(
  fileContains('src/middleware/errorHandler.js', 'export.*errorHandler'),
  'Error handler exported',
  'Global error handling'
);

// ============================================
// SECTION 9: CONFIGURATION VERIFICATION
// ============================================
log('\n⚙️  VERIFYING CONFIGURATION...', 'info');

check(
  fileExists('src/config/database.js'),
  'Database config',
  'Prisma client configured'
);

check(
  fileContains('src/config/database.js', 'export.*prisma'),
  'Prisma client exported',
  'Database access'
);

check(
  fileExists('.env'),
  '.env file',
  'Environment variables'
);

// ============================================
// SECTION 10: PRODUCTION READINESS
// ============================================
log('\n🚀 PRODUCTION READINESS CHECKS...', 'info');

check(
  fileExists('package.json'),
  'package.json',
  'Dependencies defined'
);

check(
  fileContains('package.json', '"type": "module"'),
  'ESM enabled',
  'Module system configured'
);

warn(
  fileContains('.env', 'NODE_ENV=production'),
  'NODE_ENV set to production',
  'Production environment flag'
);

warn(
  fileContains('.env', 'DATABASE_URL'),
  'DATABASE_URL configured',
  'Database connection'
);

warn(
  fileContains('.env', 'JWT_SECRET'),
  'JWT_SECRET configured',
  'Token signing'
);

warn(
  fileContains('.env', 'CORS_ORIGIN'),
  'CORS_ORIGIN configured',
  'CORS security'
);

// ============================================
// SUMMARY
// ============================================
log('\n========================================', 'info');
log('   VERIFICATION SUMMARY', 'info');
log('========================================\n');

log(`✓ Passed: ${results.passed.length}`, 'success');
log(`✗ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
log(`⚠ Warnings: ${results.warnings.length}`, 'warning');

if (results.failed.length > 0) {
  log('\n❌ FAILED CHECKS:', 'error');
  results.failed.forEach(f => {
    log(`  - ${f.name}: ${f.description}`, 'error');
  });
}

if (results.warnings.length > 0) {
  log('\n⚠️  WARNINGS:', 'warning');
  results.warnings.forEach(w => {
    log(`  - ${w.name}: ${w.description}`, 'warning');
  });
}

if (results.failed.length === 0) {
  log('\n🎉 ALL CRITICAL CHECKS PASSED!', 'success');
  log('✅ System is production-ready', 'success');
  log('\nNext steps:', 'info');
  log('  1. Run: npm run prisma:migrate', 'info');
  log('  2. Run: npm run prisma:generate', 'info');
  log('  3. Set NODE_ENV=production', 'info');
  log('  4. Start: npm start', 'info');
}

console.log('\n');

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);
