const express = require('express');
const router = express.Router();
const { AppointmentDB, AuditDB } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/appointments  — barcha yoki filter qilingan
router.get('/', requireAuth, (req, res) => {
  try {
    const { doctorId, patientId, date } = req.query;
    let appts;
    if (doctorId) {
      appts = AppointmentDB.getByDoctor(doctorId, date);
    } else if (patientId) {
      appts = AppointmentDB.getByPatient(patientId);
    } else {
      appts = AppointmentDB.getAll();
    }
    res.json(appts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/appointments/available-slots?doctorId=X&date=YYYY-MM-DD
// Doktorning berilgan sanasidagi bo'sh slotlarini qaytaradi
router.get('/available-slots', requireAuth, (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId va date parametrlari shart' });
    }

    // 08:00 dan 18:00 gacha, har 30 daqiqada slot
    const allSlots = [];
    for (let h = 8; h < 18; h++) {
      allSlots.push(`${String(h).padStart(2,'0')}:00`);
      allSlots.push(`${String(h).padStart(2,'0')}:30`);
    }

    const booked = AppointmentDB.getByDoctor(doctorId, date)
      .filter(a => a.status !== 'cancelled');

    const toMin = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };

    const available = allSlots.filter(slot => {
      const slotStart = toMin(slot);
      const slotEnd = slotStart + 30;
      return !booked.some(a => {
        const s = toMin(a.appointmentTime);
        const e = s + a.durationMinutes;
        return slotStart < e && s < slotEnd;
      });
    });

    res.json({ date, doctorId, availableSlots: available, bookedCount: booked.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/appointments/:id
router.get('/:id', requireAuth, (req, res) => {
  const appt = AppointmentDB.getById(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Qabul topilmadi' });
  res.json(appt);
});

// POST /api/appointments
router.post('/', requireAuth, (req, res) => {
  try {
    const { doctorId, patientId, appointmentDate, appointmentTime, durationMinutes, notes } = req.body;
    if (!doctorId || !patientId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring" });
    }

    // Vaqt to'qnashuvi tekshiruvi
    const conflict = AppointmentDB.checkConflict(doctorId, appointmentDate, appointmentTime, durationMinutes || 30);
    if (conflict) {
      return res.status(409).json({
        error: `Bu shifokor ${appointmentDate} kuni ${conflict.appointmentTime} da band. Boshqa vaqt tanlang.`,
        conflictWith: conflict,
      });
    }

    const appt = AppointmentDB.create({
      doctorId, patientId, appointmentDate, appointmentTime,
      durationMinutes: durationMinutes || 30,
      notes: notes || '',
      createdBy: req.user.id,
    });
    AuditDB.log(req.user.id, 'CREATE', 'Appointment', appt.id, `Qabul: ${appointmentDate} ${appointmentTime}`);
    res.status(201).json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, durationMinutes } = req.body;

    // Agar vaqt o'zgarsa — conflict tekshir
    if (doctorId && appointmentDate && appointmentTime) {
      const conflict = AppointmentDB.checkConflict(
        doctorId, appointmentDate, appointmentTime, durationMinutes || 30, req.params.id
      );
      if (conflict) {
        return res.status(409).json({
          error: `Bu shifokor ${appointmentDate} kuni ${conflict.appointmentTime} da band. Boshqa vaqt tanlang.`,
          conflictWith: conflict,
        });
      }
    }

    const appt = AppointmentDB.update(req.params.id, req.body);
    if (!appt) return res.status(404).json({ error: 'Qabul topilmadi' });
    AuditDB.log(req.user.id, 'UPDATE', 'Appointment', appt.id, `Qabul yangilandi`);
    res.json(appt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAuth, (req, res) => {
  const ok = AppointmentDB.delete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Qabul topilmadi' });
  AuditDB.log(req.user.id, 'DELETE', 'Appointment', req.params.id, 'Qabul bekor qilindi');
  res.json({ success: true });
});

module.exports = router;
