const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./models/schema');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const requestRoutes = require('./routes/requestRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database schema
initSchema();

// Auto-seed initial demo data if database is brand new
try {
  const db = require('./config/db');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
  if (userCount === 0) {
    console.log('Brand new database detected. Auto-seeding initial demo data...');
    const { seed } = require('./utils/seed');
    seed();
  }
} catch (err) {
  console.warn('Could not auto-seed database:', err.message);
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const fs = require('node:fs');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Serve frontend production build if it exists
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✅ Student Carpool Backend running on port ${PORT}`);
    console.log(`🔌 API Health:   http://localhost:${PORT}/api/health`);
    console.log(`🌐 Web App:      http://localhost:${PORT}`);
    console.log(`👉 If using Vite Dev Server: http://localhost:3000`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
