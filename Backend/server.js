const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const patientRoutes = require('./routes/patients');
const illnessRoutes = require('./routes/illnesses');
const appointmentRoutes = require('./routes/appointments');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareTrack Backend is Running'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Backend Running',
    port: PORT
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/illnesses', illnessRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/audit', auditRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route topilmadi'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Server xatosi'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CareTrack Backend running on port ${PORT}`);
});