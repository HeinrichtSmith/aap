/**
 * BULL QUEUE CONFIGURATION
 * 
 * Sets up Bull queues for background job processing.
 * Uses Redis for queue storage (or in-memory for development).
 */

import Queue from 'bull';
// import { setupCleanupExpiredLocksJobCron } from '../jobs/cleanupExpiredLocksJob.js';
// import { setupInventorySyncJobCron } from '../jobs/inventorySyncJob.js';
import logger from '../utils/logger.js';

// Queue configuration
const queueConfig = {
  defaultJobOptions: {
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs
      age: 7 * 24 * 3600, // 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
  limiter: {
    max: 100, // Max 100 jobs per window
    duration: 1000, // Per second
  },
};

// Redis configuration (disabled for SQLite setup)
let stockQueue, notificationQueue, reportQueue, syncQueue;
let queueEnabled = false;

try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
    };
    
    stockQueue = new Queue('stock-operations', redisConfig, queueConfig);
    notificationQueue = new Queue('notifications', redisConfig, queueConfig);
    reportQueue = new Queue('reports', redisConfig, queueConfig);
    syncQueue = new Queue('sync-operations', redisConfig, queueConfig);
    queueEnabled = true;
  }
} catch (error) {
  console.warn('⚠️  Queue system disabled - Redis not configured');
  queueEnabled = false;
}

// Export queues (undefined if not enabled)
export { stockQueue, notificationQueue, reportQueue, syncQueue, queueEnabled };

// Queue event logging (only if enabled)
if (queueEnabled && stockQueue) {
  stockQueue.on('error', (error) => logger.error('Stock queue error:', error));
  stockQueue.on('waiting', (jobId) => logger.debug(`Job ${jobId} waiting`));
  stockQueue.on('active', (job) => logger.info(`Job ${job.id} started: ${job.name}`));
  stockQueue.on('completed', (job, result) => logger.info(`Job ${job.id} completed: ${job.name}`, result));
  stockQueue.on('failed', (job, error) => logger.error(`Job ${job.id} failed: ${job.name}`, error.message));

  notificationQueue.on('error', (error) => logger.error('Notification queue error:', error));
  notificationQueue.on('completed', (job) => logger.info(`Notification sent: ${job.id}`));

  reportQueue.on('error', (error) => logger.error('Report queue error:', error));
  reportQueue.on('completed', (job) => logger.info(`Report generated: ${job.id}`));

  syncQueue.on('error', (error) => logger.error('Sync queue error:', error));
  syncQueue.on('completed', (job) => logger.info(`Sync completed: ${job.id}`));
}

/**
 * Setup all cron jobs
 * Call this once when server starts
 */
export async function setupCronJobs() {
  try {
    logger.info('Setting up cron jobs...');
    
    // Cleanup expired locks every 15 minutes
    // await setupCleanupExpiredLocksJobCron(stockQueue);
    
    // Inventory sync at 2 AM daily
    // await setupInventorySyncJobCron(syncQueue);
    
    logger.info('Cron jobs setup complete (skipped - job files not created yet)');
  } catch (error) {
    logger.error('Error setting up cron jobs:', error);
    // Don't throw error - allow server to start without cron jobs
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueues() {
  try {
    logger.info('Closing queues...');
    await Promise.all([
      stockQueue.close(),
      notificationQueue.close(),
      reportQueue.close(),
      syncQueue.close(),
    ]);
    logger.info('Queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
    throw error;
  }
}
