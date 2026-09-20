'use strict';
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  mongoose.set('strictQuery', true);

  const opts = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    /* Auto-reconnect on Atlas free-tier idle disconnects */
    heartbeatFrequencyMS: 10000,
  };

  async function connect() {
    try {
      await mongoose.connect(uri, opts);
      console.log(`✅  MongoDB Atlas connected — db: ${mongoose.connection.name}`);
    } catch (err) {
      console.error('❌  MongoDB connection failed:', err.message);
      process.exit(1);
    }
  }

  await connect();

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️   MongoDB disconnected — attempting reconnect…');
    setTimeout(() => {
      mongoose.connect(uri, opts).catch(err => {
        console.error('Reconnect failed:', err.message);
      });
    }, 3000);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅  MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });
}

module.exports = connectDB;
