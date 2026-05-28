const express = require('express');
const router = express.Router();
const { UserDB, AuditDB } = require('../db/database');
const { generateToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol kiritilishi shart' });
    }
    const user = UserDB.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    }
    const token = generateToken(user);
    // Don't send password to frontend
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/auth/me  — verify token and return current user
router.get('/me', requireAuth, (req, res) => {
  const user = UserDB.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// GET /api/auth/users — admin only
router.get('/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  const users = UserDB.getAll().map(({ password: _, ...u }) => u);
  res.json(users);
});

// GET /api/auth/users/credentials — admin only (with credentials)
router.get('/users/credentials', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  const bcrypt = require('bcryptjs');
  const defaultPasswords = {
    admin: 'admin123',
    doctor1: 'doctor123',
    reception1: 'recep123',
  };
  const users = UserDB.getAll().map((u) => ({
    id: u.id,
    username: u.username,
    password: defaultPasswords[u.username] && bcrypt.compareSync(defaultPasswords[u.username], u.password)
      ? defaultPasswords[u.username]
      : "Parol o'zgartirilgan",
    role: u.role,
    fullName: u.fullName,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy va yangi parollar kiritilishi shart' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' });
    }
    
    const user = UserDB.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }
    
    const bcrypt = require('bcryptjs');
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });
    }
    
    const success = UserDB.updatePassword(req.user.id, newPassword);
    if (!success) {
      return res.status(500).json({ error: 'Parolni o\'zgartirishda xato' });
    }
    
    AuditDB.log(req.user.id, 'CHANGE_PASSWORD', 'user', req.user.id, 'Parol o\'zgartirildi');
    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
