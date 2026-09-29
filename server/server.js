'use strict';
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const connectDB = require('./db');

/* ── Bootstrap ── */
const app  = express();
const PORT = process.env.PORT || 5001;

/* ── CORS ──
 * CORS_ORIGIN can be:
 *   '*'                              → allow all (dev / open API)
 *   'https://example.com'           → single origin
 *   'https://a.com,https://b.com'   → comma-separated list (production)
 *
 * The function form is required so the server echoes back the specific
 * request origin in the ACAO header — credentials: true requires this.
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(requestOrigin, callback) {
    /* Allow requests with no Origin header (curl, Postman, server-to-server) */
    if (!requestOrigin) return callback(null, true);
    /* Wildcard — allow everything */
    if (ALLOWED_ORIGINS.includes('*')) return callback(null, true);
    /* Exact match */
    if (ALLOWED_ORIGINS.includes(requestOrigin)) return callback(null, requestOrigin);
    /* Vercel preview deployments — e.g. find-mu-pandit-git-main-xyz.vercel.app */
    const isVercelPreview = ALLOWED_ORIGINS.some(o =>
      o.endsWith('.vercel.app') && requestOrigin.endsWith('.vercel.app') &&
      requestOrigin.includes(o.replace('https://', '').split('.vercel.app')[0])
    );
    if (isVercelPreview) return callback(null, requestOrigin);
    callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

/* ── Routes ── */
app.use('/api/auth',                   require('./routes/auth'));
app.use('/api/users',                  require('./routes/users'));
app.use('/api/categories',             require('./routes/categories'));
app.use('/api/services',               require('./routes/services'));
app.use('/api/providers',              require('./routes/providers'));
app.use('/api/service-requests',       require('./routes/serviceRequests'));
app.use('/api/bookings',               require('./routes/bookings'));
app.use('/api/reviews',                require('./routes/reviews'));
app.use('/api/matches',                require('./routes/matches'));
/* ── New domains ── */
app.use('/api/organizations',          require('./routes/organizations'));
app.use('/api/payments',               require('./routes/payments'));
app.use('/api/notifications',          require('./routes/notifications'));
app.use('/api/conversations',          require('./routes/conversations'));
app.use('/api/provider-services',      require('./routes/providerServices'));
app.use('/api/provider-availability',  require('./routes/providerAvailability'));
app.use('/api/audit-logs',             require('./routes/auditLogs'));

app.use('/api/panditji-ai',             require('./routes/ai'));

/* ── Geo Location ── */
app.use('/api/geo',                    require('./routes/geo'));

/* ── Admin Panel ── */
app.use('/api/admin',                  require('./routes/admin'));

/* ── Pandit Portal ── */
app.use('/api/pandit-portal',          require('./routes/panditPortal'));

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ── Error handler ── */
app.use((err, req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ── Start ── */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  PanditJi server running on http://localhost:${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/api/health`);
  });
});
