// server.js — Main entry point for College ERP Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const feesRoutes = require('./routes/fees.routes');
const timetableRoutes = require('./routes/timetable.routes');
const libraryRoutes = require('./routes/library.routes');
const tasksRoutes = require('./routes/tasks.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notifications.routes');
const reportsRoutes = require('./routes/reports.routes');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.set('trust proxy', 1);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parser ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ──────────────────────────────────────────────────────
app.use(logger.requestMiddleware);

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/students',   studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees',       feesRoutes);
app.use('/api/timetable',  timetableRoutes);
app.use('/api/library',    libraryRoutes);
app.use('/api/tasks',      tasksRoutes);
app.use('/api/dashboard',      dashboardRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/reports',        reportsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'College ERP API is running', timestamp: new Date() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`College ERP Server started`, { port: PORT, env: process.env.NODE_ENV });
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🎓 College ERP Server running on http://localhost:${PORT}/api\n`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

module.exports = app;
