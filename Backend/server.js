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


app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());
  
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/illnesses', illnessRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

app.listen(PORT, () => {
  console.log(`🚀 CareTrack Backend: http://localhost:${PORT}`);
});
