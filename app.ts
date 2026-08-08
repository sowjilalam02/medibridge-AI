import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patient';
import doctorRoutes from './routes/doctor';
import hospitalAdminRoutes from './routes/hospitalAdmin';
import superAdminRoutes from './routes/superAdmin';
import { seedDatabase } from './utils/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medibridge';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/hospital-admin', hospitalAdminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Base route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Database connection & startup
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    // Seed Database with initial data
    await seedDatabase();
  })
  .catch((err) => {
    console.warn('\n=========================================');
    console.warn('WARNING: Failed to connect to MongoDB!');
    console.warn('Reason:', err.message);
    console.warn('The API server will still run, but DB requests will fail.');
    console.warn('Please ensure MongoDB is running or configure MONGODB_URI.');
    console.warn('=========================================\n');
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  });
