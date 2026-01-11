import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { validationResult } from 'express-validator';

// Import routes
import authRoutes from './routes/authRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import sitesRoutes from './routes/sitesRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import binsRoutes from './routes/binsRoutes.js';
import purchaseOrdersRoutes from './routes/purchaseOrdersRoutes.js';
import returnsRoutes from './routes/returnsRoutes.js';
import stockTakesRoutes from './routes/stockTakesRoutes.js';
import discrepanciesRoutes from './routes/discrepanciesRoutes.js';
import batchesRoutes from './routes/batchesRoutes.js';
import wavesRoutes from './routes/wavesRoutes.js';
import transfersRoutes from './routes/transfersRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupCronJobs, closeQueues } from './config/queue.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS - Allow both localhost and file:// protocol for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || 'http://localhost:5173')
    : true, // Allow all origins in development (including file://)
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Validation error handler
app.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errors.array(),
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bins', binsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/stock-takes', stockTakesRoutes);
app.use('/api/discrepancies', discrepanciesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/waves', wavesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════════════════════════╗
║                                                               ║
║   🏭 OpsUI Backend Server Running                           ║
║                                                               ║
║   📍 Environment: ${process.env.NODE_ENV || 'development'}         ║
║   🌐 Port: ${PORT}                                                   ║
║   🔗 API: http://localhost:${PORT}/api                       ║
║                                                               ║
╚═════════════════════════════════════════════════════════╝
  `);
});

// Setup cron jobs
setupCronJobs().catch(error => {
  console.error('Failed to setup cron jobs:', error);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} signal received: shutting down gracefully`);
  try {
    await closeQueues();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;