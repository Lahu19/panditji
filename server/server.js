'use strict';
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const connectDB = require('./db');

/* ── Bootstrap ── */
const app  = express();
const PORT = process.env.PORT || 5001;

/* ── Middleware ── */
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
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
