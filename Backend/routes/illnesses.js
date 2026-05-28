const express = require('express');
const router = express.Router();
const { IllnessDB, AuditDB } = require('../db/database');
const { requireAuth, requireClinician } = require('../middleware/auth');

// GET /api/illnesses
router.get('/', requireAuth, (req, res) => {
  try {
    const { search, patientId } = req.query;
    let illnesses = search ? IllnessDB.search(search) : IllnessDB.getAll();
    if (patientId) {
      illnesses = illnesses.filter(i => i.patientId === patientId);
    }
    res.json(illnesses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  } 
});

// GET /api/illnesses/:id
router.get('/:id', requireAuth, (req, res) => {
  const illness = IllnessDB.getById(req.params.id);
  if (!illness) return res.status(404).json({ error: 'Tashxis topilmadi' });
  res.json(illness);
});

// POST /api/illnesses
router.post('/', requireAuth, requireClinician, (req, res) => {
  try {
    const data = req.body;
    if (!data.patientId || !data.icdCode || !data.description || !data.severity || !data.diagnosisDate) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }
    const illness = IllnessDB.create(data);
    AuditDB.log(req.user.id, 'CREATE', 'Illness', illness.id, `Created illness: ${data.icdCode}`);
    res.status(201).json(illness);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/illnesses/:id
router.put('/:id', requireAuth, requireClinician, (req, res) => {
  try {
    const illness = IllnessDB.update(req.params.id, req.body);
    if (!illness) return res.status(404).json({ error: 'Tashxis topilmadi' });
    AuditDB.log(req.user.id, 'UPDATE', 'Illness', illness.id, `Updated illness: ${illness.icdCode}`);
    res.json(illness);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/illnesses/:id
router.delete('/:id', requireAuth, requireClinician, (req, res) => {
  const ok = IllnessDB.delete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tashxis topilmadi' });
  AuditDB.log(req.user.id, 'DELETE', 'Illness', req.params.id, 'Deleted illness');
  res.json({ success: true, message: "Tashxis o'chirildi" });
});

module.exports = router;
