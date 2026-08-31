const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Disable command buffering so Mongoose operations fail fast or succeed immediately
mongoose.set('bufferCommands', false);

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'DisasterChain',
    tagline: 'Respond Faster. Recover Smarter. Track Transparently.',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas Connected' : 'In-Memory Mode',
    dbHost: mongoose.connection.host || 'N/A',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/shelters', require('./routes/shelterRoutes'));
app.use('/api/affected-areas', require('./routes/affectedAreaRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/distributions', require('./routes/distributionRoutes'));
app.use('/api/preparedness', require('./routes/preparednessRoutes'));
app.use('/api/blockchain', require('./routes/blockchainRoutes'));
app.use('/api/seed', require('./routes/seedRoutes'));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on DisasterChain server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚨 DisasterChain Server running on port ${PORT}`);
    console.log(`🌐 API Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`🌱 Database Seeder: http://localhost:${PORT}/api/seed`);
    console.log(`====================================================`);
  });
}

startServer();
