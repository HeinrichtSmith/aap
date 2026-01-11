/**
 * Schema Migration Awareness System
 * 
 * This tool tracks current schema version, pending migrations, and prevents
 * breaking changes without proper migration protocols. Critical for paying users.
 * 
 * Usage:
 * import { checkSchemaVersion, trackMigration } from './utils/schemaMigration.js';
 */

const fs = require('fs');
const path = require('path');

/**
 * Migration tracking file path
 */
const MIGRATION_TRACKER_PATH = path.join(__dirname, '../../.migration-tracker.json');

/**
 * Current schema version (should match Prisma schema)
 */
const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Migration history
 */
const MIGRATION_HISTORY = [];

/**
 * Schema change types that require migration
 */
const BREAKING_CHANGES = {
  // Model changes
  modelDeleted: ['Model deleted without migration'],
  modelRenamed: ['Model renamed without migration'],
  fieldDeleted: ['Field deleted from model without migration'],
  fieldRenamed: ['Field renamed without migration'],
  fieldTypeChanged: ['Field type changed without migration'],
  fieldRequiredChanged: ['Field required/optional changed without migration'],
  
  // Relation changes
  relationDeleted: ['Relation deleted without migration'],
  relationChanged: ['Relation cardinality changed without migration'],
  
  // Index changes
  indexDeleted: ['Index deleted without migration'],
  uniqueConstraintChanged: ['Unique constraint changed without migration'],
  
  // Enum changes
  enumDeleted: ['Enum deleted without migration'],
  enumValueChanged: ['Enum value deleted without migration'],
};

/**
 * Initialize migration tracker
 */
function initMigrationTracker() {
  if (!fs.existsSync(MIGRATION_TRACKER_PATH)) {
    const initialTracker = {
      currentVersion: CURRENT_SCHEMA_VERSION,
      lastMigrationDate: new Date().toISOString(),
      migrations: [],
      pendingMigrations: [],
      schemaChecksum: generateSchemaChecksum(),
    };
    
    fs.writeFileSync(
      MIGRATION_TRACKER_PATH,
      JSON.stringify(initialTracker, null, 2)
    );
    
    return initialTracker;
  }
  
  const tracker = JSON.parse(
    fs.readFileSync(MIGRATION_TRACKER_PATH, 'utf-8')
  );
  
  return tracker;
}

/**
 * Generate schema checksum (simplified version)
 */
function generateSchemaChecksum() {
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    return 'unknown';
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Simple hash: count lines, models, fields
  const lines = schema.split('\n').length;
  const models = (schema.match(/model \w+/g) || []).length;
  const fields = (schema.match(/^\s+\w+\s+\w+/gm) || []).length;
  
  return `v${CURRENT_SCHEMA_VERSION}-${lines}-${models}-${fields}`;
}

/**
 * Check if schema version matches tracker
 */
function checkSchemaVersion() {
  const tracker = initMigrationTracker();
  
  return {
    currentVersion: CURRENT_SCHEMA_VERSION,
    trackedVersion: tracker.currentVersion,
    isCurrent: tracker.currentVersion === CURRENT_SCHEMA_VERSION,
    schemaChecksum: tracker.schemaChecksum,
    expectedChecksum: generateSchemaChecksum(),
    checksumMatches: tracker.schemaChecksum === generateSchemaChecksum(),
  };
}

/**
 * Detect potential breaking changes in schema
 */
function detectBreakingChanges(schemaContent) {
  const changes = [];
  
  // Detect model deletion (compare with known models)
  const knownModels = ['User', 'Company', 'Site', 'Product', 'Order', 'Bin', 'Inventory', 'StockTake', 'PurchaseOrder', 'Return'];
  const currentModels = (schemaContent.match(/model (\w+)/g) || []).map(m => m.replace('model ', ''));
  
  knownModels.forEach(model => {
    if (!currentModels.includes(model)) {
      changes.push({
        type: 'modelDeleted',
        severity: 'critical',
        message: `Model '${model}' appears to be deleted`,
        recommendation: 'Create a migration to preserve data before deleting model',
      });
    }
  });
  
  // Detect field type changes (simplified pattern)
  const typeChangePatterns = [
    /String\s*->\s*Int/i,
    /Int\s*->\s*String/i,
    /String\s*->\s*Boolean/i,
    /Int\s*->\s*Boolean/i,
  ];
  
  typeChangePatterns.forEach(pattern => {
    if (pattern.test(schemaContent)) {
      changes.push({
        type: 'fieldTypeChanged',
        severity: 'high',
        message: 'Field type change detected',
        recommendation: 'Create a data migration script to transform existing data',
      });
    }
  });
  
  // Detect unique constraint changes
  if (schemaContent.includes('@@unique') && schemaContent.includes('removeUnique')) {
    changes.push({
      type: 'uniqueConstraintChanged',
      severity: 'high',
      message: 'Unique constraint modification detected',
      recommendation: 'Check for duplicate data before removing unique constraint',
    });
  }
  
  // Detect relation changes
  const relationPatterns = [
    /relation\s+\w+\s*\{[^}]*\}/g,
  ];
  
  const relations = schemaContent.match(relationPatterns[0]) || [];
  if (relations.length > 0) {
    // Compare with expected relations (simplified check)
    changes.push({
      type: 'relationChanged',
      severity: 'medium',
      message: 'Relations defined in schema - verify changes are intentional',
      recommendation: 'Ensure foreign key constraints are handled in migration',
    });
  }
  
  return changes;
}

/**
 * Track a migration
 */
function trackMigration(migrationName, migrationDetails = {}) {
  const tracker = initMigrationTracker();
  
  const migration = {
    id: Date.now(),
    name: migrationName,
    version: CURRENT_SCHEMA_VERSION,
    date: new Date().toISOString(),
    details: migrationDetails,
    checksum: generateSchemaChecksum(),
  };
  
  tracker.migrations.push(migration);
  tracker.currentVersion = CURRENT_SCHEMA_VERSION;
  tracker.lastMigrationDate = new Date().toISOString();
  tracker.schemaChecksum = generateSchemaChecksum();
  
  fs.writeFileSync(
    MIGRATION_TRACKER_PATH,
    JSON.stringify(tracker, null, 2)
  );
  
  return migration;
}

/**
 * Add pending migration
 */
function addPendingMigration(migrationName, reason) {
  const tracker = initMigrationTracker();
  
  const pending = {
    id: Date.now(),
    name: migrationName,
    reason: reason,
    addedDate: new Date().toISOString(),
    status: 'pending',
  };
  
  tracker.pendingMigrations.push(pending);
  
  fs.writeFileSync(
    MIGRATION_TRACKER_PATH,
    JSON.stringify(tracker, null, 2)
  );
  
  return pending;
}

/**
 * Get migration status
 */
function getMigrationStatus() {
  const tracker = initMigrationTracker();
  const schemaCheck = checkSchemaVersion();
  
  return {
    currentVersion: tracker.currentVersion,
    lastMigration: tracker.lastMigrationDate,
    pendingMigrations: tracker.pendingMigrations.length,
    migrationsApplied: tracker.migrations.length,
    schemaInSync: schemaCheck.checksumMatches,
    schemaChecksum: schemaCheck.schemaChecksum,
    needsAttention: tracker.pendingMigrations.length > 0 || !schemaCheck.checksumMatches,
  };
}

/**
 * Validate schema before deployment
 */
function validateSchemaForDeployment(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    return {
      valid: false,
      errors: ['Schema file not found'],
      warnings: [],
    };
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  const status = getMigrationStatus();
  const breakingChanges = detectBreakingChanges(schemaContent);
  
  const errors = [];
  const warnings = [];
  
  // Check for pending migrations
  if (status.pendingMigrations > 0) {
    errors.push(
      `${status.pendingMigrations} pending migration(s) must be applied before deployment`
    );
  }
  
  // Check for breaking changes
  breakingChanges.forEach(change => {
    if (change.severity === 'critical') {
      errors.push(change.message);
    } else if (change.severity === 'high') {
      warnings.push(change.message);
    }
  });
  
  // Check schema sync
  if (!status.schemaInSync) {
    warnings.push(
      'Schema checksum has changed - ensure migrations are tracked'
    );
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    breakingChanges,
    status,
  };
}

/**
 * Generate migration report
 */
function generateMigrationReport() {
  const status = getMigrationStatus();
  const schemaCheck = checkSchemaVersion();
  const tracker = initMigrationTracker();
  
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('SCHEMA MIGRATION STATUS REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push('CURRENT STATUS');
  lines.push('-'.repeat(80));
  lines.push(`Schema Version: ${status.currentVersion}`);
  lines.push(`Last Migration: ${status.lastMigration}`);
  lines.push(`Migrations Applied: ${status.migrationsApplied}`);
  lines.push(`Pending Migrations: ${status.pendingMigrations}`);
  lines.push(`Schema In Sync: ${status.schemaInSync ? '✅ YES' : '⚠️ NO'}`);
  lines.push(`Needs Attention: ${status.needsAttention ? '⚠️ YES' : '✅ NO'}`);
  lines.push('');
  
  if (tracker.pendingMigrations.length > 0) {
    lines.push('PENDING MIGRATIONS');
    lines.push('-'.repeat(80));
    tracker.pendingMigrations.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.name}`);
      lines.push(`   Added: ${m.addedDate}`);
      lines.push(`   Reason: ${m.reason}`);
      lines.push('');
    });
  }
  
  if (tracker.migrations.length > 0) {
    lines.push('RECENT MIGRATIONS (Last 5)');
    lines.push('-'.repeat(80));
    const recent = tracker.migrations.slice(-5);
    recent.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.name} (${m.version})`);
      lines.push(`   Date: ${m.date}`);
      lines.push('');
    });
  }
  
  lines.push('SCHEMA VALIDATION');
  lines.push('-'.repeat(80));
  lines.push(`Expected Version: ${CURRENT_SCHEMA_VERSION}`);
  lines.push(`Tracked Version: ${schemaCheck.trackedVersion}`);
  lines.push(`Versions Match: ${schemaCheck.isCurrent ? '✅ YES' : '⚠️ NO'}`);
  lines.push(`Checksum Match: ${schemaCheck.checksumMatches ? '✅ YES' : '⚠️ NO'}`);
  lines.push('');
  
  if (status.needsAttention) {
    lines.push('⚠️ ACTION REQUIRED');
    lines.push('-'.repeat(80));
    if (tracker.pendingMigrations.length > 0) {
      lines.push('• Apply pending migrations before deployment');
      lines.push('• Test migrations in staging environment first');
      lines.push('• Backup production database before migrating');
    }
    if (!status.schemaInSync) {
      lines.push('• Schema has changed - verify migration is tracked');
      lines.push('• Run schema validation: npx prisma validate');
    }
  } else {
    lines.push('✅ ALL SYSTEMS NOMINAL');
    lines.push('Schema is up-to-date and ready for deployment');
  }
  
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

/**
 * Pre-deployment checklist for schema changes
 */
const PRE_DEPLOYMENT_CHECKLIST = [
  'Are all pending migrations documented in MIGRATION_TRACKER?',
  'Have migrations been tested in staging environment?',
  'Is there a database backup from before migration?',
  'Is there a rollback plan if migration fails?',
  'Have breaking changes been communicated to users?',
  'Is there sufficient downtime window for migration?',
  'Are data integrity checks in place post-migration?',
  'Is monitoring configured for post-migration issues?',
];

module.exports = {
  initMigrationTracker,
  checkSchemaVersion,
  detectBreakingChanges,
  trackMigration,
  addPendingMigration,
  getMigrationStatus,
  validateSchemaForDeployment,
  generateMigrationReport,
  PRE_DEPLOYMENT_CHECKLIST,
  CURRENT_SCHEMA_VERSION,
  BREAKING_CHANGES,
};
