const express = require('express');
const router = express.Router();
const { AuditDB, UserDB } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/audit
router.get('/', requireAuth, (req, res) => {
  try {
    const users = UserDB.getAll();
    const logs = AuditDB.getAll().map(log => ({
      ...log,
      userFullName: users.find(u => u.id === log.userId)?.fullName || 'Noma\'lum',
    }));
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
