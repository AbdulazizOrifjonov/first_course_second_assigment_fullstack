const express = require('express');
const router = express.Router();
const { DoctorDB, AuditDB } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/doctors
router.get('/', requireAuth, (req, res) => {
  try {
    const { search } = req.query;
    const doctors = search ? DoctorDB.search(search) : DoctorDB.getAll();
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/doctors/:id
router.get('/:id', requireAuth, (req, res) => {
  const doctor = DoctorDB.getById(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Shifokor topilmadi' });
  res.json(doctor);
});

// POST /api/doctors  — admin only
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { firstName, lastName, specialization, department, email, phone, licenseNumber, status } = req.body;
    if (!firstName || !lastName || !email || !phone || !licenseNumber) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    const doctor = DoctorDB.create({ firstName, lastName, specialization, department, email, phone, licenseNumber, status });
    AuditDB.log(req.user.id, 'CREATE', 'Doctor', doctor.id, `Created doctor: ${firstName} ${lastName}`);
    res.status(201).json(doctor);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Bu email yoki litsenziya raqami allaqachon mavjud' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/doctors/:id  — admin only
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const doctor = DoctorDB.update(req.params.id, req.body);
    if (!doctor) return res.status(404).json({ error: 'Shifokor topilmadi' });
    AuditDB.log(req.user.id, 'UPDATE', 'Doctor', doctor.id, `Updated doctor: ${doctor.firstName} ${doctor.lastName}`);
    res.json(doctor);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Bu email yoki litsenziya raqami allaqachon mavjud' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/doctors/:id  — admin only
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const ok = DoctorDB.delete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Shifokor topilmadi' });
  AuditDB.log(req.user.id, 'DELETE', 'Doctor', req.params.id, 'Deleted doctor');
  res.json({ success: true, message: "Shifokor o'chirildi" });
});

module.exports = router;
