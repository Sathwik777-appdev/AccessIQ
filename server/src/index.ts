import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import targetsRouter from './routes/targets';
import scansRouter from './routes/scans';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import remediationsRouter from './routes/remediations';
import fieldAuditsRouter from './routes/field-audits';
import { errorHandler } from './middleware/error-handler';
import prisma from './lib/prisma';

// Load environment variables (try server/.env first, then root/.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

import helmet from 'helmet';
import fs from 'fs';

// Enterprise Security Headers Middleware (configured for WebGL Canvas & Photo Uploads)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'http:', 'https:'],
        workerSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

import rateLimit from 'express-rate-limit';

// Rate Limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for production dashboard telemetry
  standardHeaders: true,
  legacyHeaders: false,
});

const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Limit scan triggers to 15 per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

// Routes
app.use('/api/targets', targetsRouter);
app.use('/api/scans', scanLimiter, scansRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/remediations', remediationsRouter);
app.use('/api/field-audits', fieldAuditsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Serve demo pages as static files
app.use('/demo', express.static(path.resolve(__dirname, '../../demo-pages')));

// Serve Production React Frontend
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA Catch-all route to support React Router client navigation
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/demo')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handler MUST be after all routes
app.use(errorHandler);

// Self-healing database initialization
async function verifyDatabase() {
  try {
    const count = await prisma.scanTarget.count();
    console.log(`📊 Connected to SQLite database. Verified ${count} scan targets loaded.`);
  } catch (err: any) {
    console.warn(`⚠️ Database schema check failed (${err.message}). Running automatic schema push...`);
    try {
      const { execSync } = await import('child_process');
      const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
      execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ SQLite database schema created successfully.');
    } catch (e: any) {
      console.error('❌ Schema self-healing error:', e.message);
    }
  }
}
verifyDatabase();

// Start server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 AccessIQ API server running on http://0.0.0.0:${PORT}`);
  console.log(`📋 Health check: http://0.0.0.0:${PORT}/api/health`);
});

// Graceful process termination
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('AccessIQ API server and database disconnected cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
