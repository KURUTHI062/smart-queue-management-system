const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const { isSupabaseConfigured } = require('./config/db');
const socketManager = require('./sockets/socketManager');
const { errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for local dev
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

socketManager.init(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mode: isSupabaseConfigured ? 'Supabase-Connected' : 'In-Memory-Demo',
    whatsappMode: process.env.WHATSAPP_MODE || 'demo'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SmartCare SQMS Backend Server running on port ${PORT}`);
    console.log(`🏥 Mode: ${isSupabaseConfigured ? 'Supabase Active' : 'In-Memory Demo Engine Active'}`);
    console.log(`🔌 WebSocket Server initialized`);
    console.log(`======================================================\n`);
  });
}

module.exports = { app, server };
