const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in backend/.env.');
    return false;
  }

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB Connected to Atlas: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.warn(`⚠️ MongoDB Atlas Connection Notice: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Atlas Disconnected. Reconnecting...');
  });

  try {
    const conn = await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB Connected to Atlas: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB Atlas Initial Connect Notice: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
