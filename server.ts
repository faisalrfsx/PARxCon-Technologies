import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './server/routes/auth.routes.js';
import dashboardRoutes from './server/routes/dashboard.routes.js';
import leadsRoutes from './server/routes/leads.routes.js';
import clientsRoutes from './server/routes/clients.routes.js';
import dealsRoutes from './server/routes/deals.routes.js';
import paymentsRoutes from './server/routes/payments.routes.js';
import tasksRoutes from './server/routes/tasks.routes.js';
import followupsRoutes from './server/routes/followups.routes.js';
import accountsRoutes from './server/routes/accounts.routes.js';
import renewalsRoutes from './server/routes/renewals.routes.js';
import reportsRoutes from './server/routes/reports.routes.js';
import searchRoutes from './server/routes/search.routes.js';
import importExportRoutes from './server/routes/import-export.routes.js';
import aiRoutes from './server/routes/ai.routes.js';
import settingsRoutes from './server/routes/settings.routes.js';
import { automationEngine } from './server/services/automation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security & CORS Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PARxCON Ops Agent API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/renewals', renewalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/data', importExportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Start background automation routines
automationEngine.start();

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PARxCON Ops Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
