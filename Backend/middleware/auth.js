const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'caretrack-super-secret-key-2024';
const JWT_EXPIRES_IN = '8h';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware: Authentication required
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
  req.user = decoded;
  next();
}

// Middleware: Admin only
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat administrator uchun ruxsat berilgan' });
  }
  next();
}

// Middleware: Admin or Clinician
function requireClinician(req, res, next) {
  if (!['admin', 'clinician'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Faqat shifokor yoki administrator uchun ruxsat berilgan' });
  }
  next();
}

// Middleware: Admin, Clinician, or Receptionist
function requireStaff(req, res, next) {
  if (!['admin', 'clinician', 'receptionist'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  next();
}

module.exports = { generateToken, verifyToken, requireAuth, requireAdmin, requireClinician, requireStaff };
