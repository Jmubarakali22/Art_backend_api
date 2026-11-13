const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before any other imports
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getPool, dbConfig, isUsingMemoryFallback } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading uploaded images across origins
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = await getPool();
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'connected (MySQL)';
    } else if (isUsingMemoryFallback && isUsingMemoryFallback()) {
      dbStatus = 'online (in-memory fallback store)';
    }
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }

  res.json({
    status: 'online',
    trust: 'Ar Rahman Trust Admin Panel API',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/donations', require('./routes/donations.routes'));
app.use('/api/causes', require('./routes/causes.routes'));
app.use('/api/gallery', require('./routes/gallery.routes'));
app.use('/api/volunteers', require('./routes/volunteers.routes'));
app.use('/api/contacts', require('./routes/contacts.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
app.use('/api/roles', require('./routes/roles.routes'));

// Fallback 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log('========================================================');
  console.log(`🚀 Ar Rahman Trust Admin Backend running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log('========================================================');

  // Verify DB connection
  try {
    await getPool();
    console.log(`✅ MySQL Connected: Database "${dbConfig.database}" ready.`);
  } catch (err) {
    console.warn(`⚠️ MySQL is not currently connected (${err.message}).`);
    console.warn(`   When MySQL is started, run: npm run seed in backend/ to initialize database.`);
  }
});
