const express = require('express');
const router = express.Router();
const { PatientDB, AuditDB } = require('../db/database');
const { requireAuth, requireClinician, requireStaff } = require('../middleware/auth');

// GET /api/patients
router.get('/', requireAuth, (req, res) => {
  try {
    const { search, doctorId } = req.query;
    let patients = search ? PatientDB.search(search) : PatientDB.getAll();
    if (doctorId) {
      patients = patients.filter(p => p.doctorId === doctorId);
    }
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/patients/:id
router.get('/:id', requireAuth, (req, res) => {
  const patient = PatientDB.getById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Bemor topilmadi' });
  res.json(patient);
});

// POST /api/patients
router.post('/', requireAuth, requireStaff, (req, res) => {
  try {
    const data = req.body;
    if (!data.firstName || !data.lastName || !data.phone || !data.doctorId) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    const patient = PatientDB.create(data);
    AuditDB.log(req.user.id, 'CREATE', 'Patient', patient.id, `Created patient: ${data.firstName} ${data.lastName}`);
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/patients/:id
router.put('/:id', requireAuth, requireStaff, (req, res) => {
  try {
    const patient = PatientDB.update(req.params.id, req.body);
    if (!patient) return res.status(404).json({ error: 'Bemor topilmadi' });
    AuditDB.log(req.user.id, 'UPDATE', 'Patient', patient.id, `Updated patient: ${patient.firstName} ${patient.lastName}`);
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', requireAuth, requireClinician, (req, res) => {
  const ok = PatientDB.delete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Bemor topilmadi' });
  AuditDB.log(req.user.id, 'DELETE', 'Patient', req.params.id, 'Deleted patient');
  res.json({ success: true, message: "Bemor o'chirildi" });
});

module.exports = router;
