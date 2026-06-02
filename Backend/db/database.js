const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'caretrack.db')
  : path.join(__dirname, '..', 'caretrack.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ========== CREATE TABLES ==========

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'clinician', 'receptionist')),
    full_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('male', 'female', 'other')),
    blood_type TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    doctor_id TEXT REFERENCES doctors(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS illnesses (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd_code TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('mild', 'moderate', 'severe', 'critical')),
    diagnosis_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved', 'chronic')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS db_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// ========== HELPERS ==========

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function nowISO() {
  return new Date().toISOString();
}

// ========== SEED DATA ==========

const isSeeded = db.prepare("SELECT value FROM db_meta WHERE key='seeded'").get();

if (!isSeeded) {
  db.exec('BEGIN');
  try {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, full_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(generateId(), 'admin',      bcrypt.hashSync('admin123',  10), 'admin',        'Dr. Administrator',    nowISO());
    insertUser.run(generateId(), 'doctor1',    bcrypt.hashSync('doctor123', 10), 'clinician',    'Dr. Alisher Karimov',  nowISO());
    insertUser.run(generateId(), 'reception1', bcrypt.hashSync('recep123',  10), 'receptionist', 'Malika Toshmatova',    nowISO());

    const insertDoc = db.prepare(`
      INSERT INTO doctors (id, first_name, last_name, specialization, department, email, phone, license_number, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = nowISO();
    insertDoc.run('doc1', 'Alisher', 'Karimov',  'Kardiologiya',    "Kardiologiya Bo'limi",    'a.karimov@caretrack.uz',  '+998 90 123 45 67', 'UZ-MED-2019-0451', 'active', now, now);
    insertDoc.run('doc2', 'Nilufar', 'Yusupova', 'Nevrologiya',     "Nevrologiya Bo'limi",     'n.yusupova@caretrack.uz', '+998 91 234 56 78', 'UZ-MED-2020-0782', 'active', now, now);
    insertDoc.run('doc3', 'Bobur',   'Rahimov',  'Dermatologiya',   "Dermatologiya Bo'limi",   'b.rahimov@caretrack.uz',  '+998 93 345 67 89', 'UZ-MED-2018-0334', 'active', now, now);
    insertDoc.run('doc4', 'Zulfiya', 'Mirzayeva','Ortopediya',      "Ortopediya Bo'limi",      'z.mirzayeva@caretrack.uz','+998 94 456 78 90', 'UZ-MED-2021-0991', 'active', now, now);
    insertDoc.run('doc5', 'Jasur',   'Toshmatov','Umumiy Amaliyot', "Umumiy Amaliyot Bo'limi", 'j.toshmatov@caretrack.uz','+998 97 567 89 01', 'UZ-MED-2017-0215', 'active', now, now);

    const insertPat = db.prepare(`
      INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, blood_type, email, phone, address, emergency_contact, emergency_phone, doctor_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPat.run('pat1', 'Sardor',   'Abdullayev', '1985-03-15', 'male',   'A+',  'sardor.a@gmail.com',  '+998 90 111 22 33', "Toshkent sh., Yunusobod", 'Manzura Abdullayeva', '+998 90 444 55 66', 'doc1', 'active', now, now);
    insertPat.run('pat2', 'Gulnora',  'Xasanova',   '1990-07-22', 'female', 'O+',  'gulnora.x@mail.ru',   '+998 91 222 33 44', "Toshkent sh., Chilonzor", 'Davron Xasanov',     '+998 91 777 88 99', 'doc2', 'active', now, now);
    insertPat.run('pat3', 'Mirzo',    'Ergashev',   '1978-11-08', 'male',   'B-',  'mirzo.e@inbox.uz',    '+998 93 333 44 55', "Samarqand sh., Registon", 'Shahnoza Ergasheva', '+998 93 666 77 88', 'doc3', 'active', now, now);
    insertPat.run('pat4', 'Mohira',   'Qodirov',    '2001-05-30', 'female', 'AB+', 'mohira.q@gmail.com',  '+998 94 444 55 66', "Namangan sh., Yangi shahar", 'Ikrom Qodirov',   '+998 94 123 45 67', 'doc1', 'active', now, now);
    insertPat.run('pat5', 'Ulugbek',  'Normatov',   '1965-09-12', 'male',   'O-',  'u.normatov@yahoo.com','+998 97 555 66 77', "Andijon sh., Asaka",      'Sitora Normatova',   '+998 97 321 54 76', 'doc4', 'active', now, now);
    insertPat.run('pat6', 'Shahnoza', 'Botirov',    '1995-12-03', 'female', 'A-',  'shahnoza.b@mail.uz',  '+998 99 666 77 88', "Toshkent sh., Mirzo Ulugbek", 'Bahrom Botirov', '+998 99 888 99 00', 'doc5', 'active', now, now);

    const insertIll = db.prepare(`
      INSERT INTO illnesses (id, patient_id, icd_code, description, severity, diagnosis_date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertIll.run('ill1', 'pat1', 'I21.0', "O'tkir transmural miokard infarkti",     'critical', '2024-01-15', 'chronic',  "Stent o'rnatildi.", now, now);
    insertIll.run('ill2', 'pat1', 'I10',   'Gipertoniya',                            'moderate', '2023-06-20', 'chronic',  'Antihipertenziv dorilar.', now, now);
    insertIll.run('ill3', 'pat2', 'G43.9', "Migren bosh og'riq",                     'moderate', '2024-02-10', 'active',   'Triptan dori buyurildi.', now, now);
    insertIll.run('ill4', 'pat3', 'L20.9', 'Atopik dermatit',                        'mild',     '2024-03-05', 'active',   'Namlantiruvchi krem.', now, now);
    insertIll.run('ill5', 'pat4', 'E11.9', 'Qandli diabet II tur',                   'moderate', '2023-11-18', 'chronic',  'Metformin buyurildi.', now, now);
    insertIll.run('ill6', 'pat5', 'M17.1', "Tizza bo'g'imi osteoartriti",            'severe',   '2024-01-28', 'active',   'Fizioterapiya.', now, now);
    insertIll.run('ill7', 'pat6', 'J06.9', "O'tkir nafas yo'llari infeksiyasi",      'mild',     '2024-04-12', 'resolved', "Bemor sog'aydi.", now, now);

    db.prepare("INSERT INTO db_meta (key, value) VALUES ('seeded', 'true')").run();
    db.exec('COMMIT');
    console.log('✅ Database seeded');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ========== ROW MAPPERS ==========

function mapUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, password: row.password, role: row.role, fullName: row.full_name, createdAt: row.created_at };
}

function mapDoctor(row) {
  if (!row) return null;
  return { id: row.id, firstName: row.first_name, lastName: row.last_name, specialization: row.specialization, department: row.department, email: row.email, phone: row.phone, licenseNumber: row.license_number, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapPatient(row) {
  if (!row) return null;
  return { id: row.id, firstName: row.first_name, lastName: row.last_name, dateOfBirth: row.date_of_birth, gender: row.gender, bloodType: row.blood_type, email: row.email, phone: row.phone, address: row.address, emergencyContact: row.emergency_contact, emergencyPhone: row.emergency_phone, doctorId: row.doctor_id, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapIllness(row) {
  if (!row) return null;
  return { id: row.id, patientId: row.patient_id, icdCode: row.icd_code, description: row.description, severity: row.severity, diagnosisDate: row.diagnosis_date, status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapAppointment(row) {
  if (!row) return null;
  return { id: row.id, doctorId: row.doctor_id, patientId: row.patient_id, appointmentDate: row.appointment_date, appointmentTime: row.appointment_time, durationMinutes: row.duration_minutes, status: row.status, notes: row.notes, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at };
}

function mapAuditLog(row) {
  if (!row) return null;
  return { id: row.id, userId: row.user_id, action: row.action, entity: row.entity, entityId: row.entity_id, details: row.details, timestamp: row.timestamp };
}

// ========== USER DB ==========

const UserDB = {
  getAll: () => db.prepare('SELECT * FROM users ORDER BY created_at').all().map(mapUser),
  findByUsername: (username) => mapUser(db.prepare('SELECT * FROM users WHERE username = ?').get(username)),
  findById: (id) => mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)),
  authenticate: (username, password) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return null;
    if (!bcrypt.compareSync(password, user.password)) return null;
    return mapUser(user);
  },
  updatePassword: (id, newPassword) => {
    const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), id);
    return result.changes > 0;
  },
};

// ========== DOCTOR DB ==========

const DoctorDB = {
  getAll: () => db.prepare('SELECT * FROM doctors ORDER BY created_at').all().map(mapDoctor),
  getById: (id) => mapDoctor(db.prepare('SELECT * FROM doctors WHERE id = ?').get(id)),
  create: (data) => {
    const id = generateId(); const now = nowISO();
    db.prepare(`INSERT INTO doctors (id,first_name,last_name,specialization,department,email,phone,license_number,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.firstName, data.lastName, data.specialization, data.department, data.email, data.phone, data.licenseNumber, data.status||'active', now, now);
    return DoctorDB.getById(id);
  },
  update: (id, data) => {
    const existing = DoctorDB.getById(id); if (!existing) return null;
    const m = { ...existing, ...data };
    db.prepare(`UPDATE doctors SET first_name=?,last_name=?,specialization=?,department=?,email=?,phone=?,license_number=?,status=?,updated_at=? WHERE id=?`)
      .run(m.firstName, m.lastName, m.specialization, m.department, m.email, m.phone, m.licenseNumber, m.status, nowISO(), id);
    return DoctorDB.getById(id);
  },
  delete: (id) => db.prepare('DELETE FROM doctors WHERE id = ?').run(id).changes > 0,
  search: (query) => {
    const q = `%${query}%`;
    return db.prepare(`SELECT * FROM doctors WHERE first_name LIKE ? OR last_name LIKE ? OR specialization LIKE ? OR department LIKE ? OR email LIKE ? OR license_number LIKE ?`).all(q,q,q,q,q,q).map(mapDoctor);
  },
};

// ========== PATIENT DB ==========

const PatientDB = {
  getAll: () => db.prepare('SELECT * FROM patients ORDER BY created_at').all().map(mapPatient),
  getById: (id) => mapPatient(db.prepare('SELECT * FROM patients WHERE id = ?').get(id)),
  create: (data) => {
    const id = generateId(); const now = nowISO();
    db.prepare(`INSERT INTO patients (id,first_name,last_name,date_of_birth,gender,blood_type,email,phone,address,emergency_contact,emergency_phone,doctor_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.firstName, data.lastName, data.dateOfBirth, data.gender, data.bloodType||'', data.email||'', data.phone, data.address||'', data.emergencyContact||'', data.emergencyPhone||'', data.doctorId, data.status||'active', now, now);
    return PatientDB.getById(id);
  },
  update: (id, data) => {
    const existing = PatientDB.getById(id); if (!existing) return null;
    const m = { ...existing, ...data };
    db.prepare(`UPDATE patients SET first_name=?,last_name=?,date_of_birth=?,gender=?,blood_type=?,email=?,phone=?,address=?,emergency_contact=?,emergency_phone=?,doctor_id=?,status=?,updated_at=? WHERE id=?`)
      .run(m.firstName, m.lastName, m.dateOfBirth, m.gender, m.bloodType, m.email, m.phone, m.address, m.emergencyContact, m.emergencyPhone, m.doctorId, m.status, nowISO(), id);
    return PatientDB.getById(id);
  },
  delete: (id) => db.prepare('DELETE FROM patients WHERE id = ?').run(id).changes > 0,
  search: (query) => {
    const q = `%${query}%`;
    return db.prepare(`SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?`).all(q,q,q,q).map(mapPatient);
  },
};

// ========== ILLNESS DB ==========

const IllnessDB = {
  getAll: () => db.prepare('SELECT * FROM illnesses ORDER BY created_at').all().map(mapIllness),
  getById: (id) => mapIllness(db.prepare('SELECT * FROM illnesses WHERE id = ?').get(id)),
  create: (data) => {
    const id = generateId(); const now = nowISO();
    db.prepare(`INSERT INTO illnesses (id,patient_id,icd_code,description,severity,diagnosis_date,status,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.patientId, data.icdCode, data.description, data.severity, data.diagnosisDate, data.status||'active', data.notes||'', now, now);
    return IllnessDB.getById(id);
  },
  update: (id, data) => {
    const existing = IllnessDB.getById(id); if (!existing) return null;
    const m = { ...existing, ...data };
    db.prepare(`UPDATE illnesses SET patient_id=?,icd_code=?,description=?,severity=?,diagnosis_date=?,status=?,notes=?,updated_at=? WHERE id=?`)
      .run(m.patientId, m.icdCode, m.description, m.severity, m.diagnosisDate, m.status, m.notes, nowISO(), id);
    return IllnessDB.getById(id);
  },
  delete: (id) => db.prepare('DELETE FROM illnesses WHERE id = ?').run(id).changes > 0,
  search: (query) => {
    const q = `%${query}%`;
    return db.prepare(`SELECT * FROM illnesses WHERE icd_code LIKE ? OR description LIKE ? OR severity LIKE ?`).all(q,q,q).map(mapIllness);
  },
};

// ========== APPOINTMENT DB ==========

const AppointmentDB = {
  getAll: () => db.prepare('SELECT * FROM appointments ORDER BY appointment_date, appointment_time').all().map(mapAppointment),
  getById: (id) => mapAppointment(db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)),
  getByDoctor: (doctorId, date) => {
    if (date) {
      return db.prepare('SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ? ORDER BY appointment_time').all(doctorId, date).map(mapAppointment);
    }
    return db.prepare('SELECT * FROM appointments WHERE doctor_id = ? ORDER BY appointment_date, appointment_time').all(doctorId).map(mapAppointment);
  },
  getByPatient: (patientId) => db.prepare('SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC, appointment_time').all(patientId).map(mapAppointment),

  // Qoʻshimcha funksiya: doktorning berilgan sana+vaqtda band yoki yo'qligini tekshirish
  // Appointment_time = "HH:MM", duration_minutes = 30 (default)
  // Yangi slot: [newStart, newStart+30min)
  // Mavjud slot: [existStart, existStart+duration)
  // Band bo'lsa: newStart < existEnd && existStart < newEnd
  checkConflict: (doctorId, date, time, durationMinutes = 30, excludeId = null) => {
    const existing = db.prepare(
      `SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`
    ).all(doctorId, date).map(mapAppointment);

    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(time);
    const newEnd = newStart + durationMinutes;

    for (const appt of existing) {
      if (excludeId && appt.id === excludeId) continue;
      const existStart = toMinutes(appt.appointmentTime);
      const existEnd = existStart + appt.durationMinutes;
      if (newStart < existEnd && existStart < newEnd) {
        return appt; // conflict topildi
      }
    }
    return null;
  },

  create: (data) => {
    const id = generateId(); const now = nowISO();
    db.prepare(`INSERT INTO appointments (id,doctor_id,patient_id,appointment_date,appointment_time,duration_minutes,status,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, data.doctorId, data.patientId, data.appointmentDate, data.appointmentTime, data.durationMinutes||30, data.status||'scheduled', data.notes||'', data.createdBy, now, now);
    return AppointmentDB.getById(id);
  },
  update: (id, data) => {
    const existing = AppointmentDB.getById(id); if (!existing) return null;
    const m = { ...existing, ...data };
    db.prepare(`UPDATE appointments SET doctor_id=?,patient_id=?,appointment_date=?,appointment_time=?,duration_minutes=?,status=?,notes=?,updated_at=? WHERE id=?`)
      .run(m.doctorId, m.patientId, m.appointmentDate, m.appointmentTime, m.durationMinutes, m.status, m.notes, nowISO(), id);
    return AppointmentDB.getById(id);
  },
  delete: (id) => db.prepare('DELETE FROM appointments WHERE id = ?').run(id).changes > 0,
};

// ========== AUDIT LOG DB ==========

const AuditDB = {
  log: (userId, action, entity, entityId, details) => {
    db.prepare(`INSERT INTO audit_logs (id,user_id,action,entity,entity_id,details,timestamp) VALUES (?,?,?,?,?,?,?)`)
      .run(generateId(), userId, action, entity, entityId, details, nowISO());
    db.prepare(`DELETE FROM audit_logs WHERE id NOT IN (SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 500)`).run();
  },
  getAll: () => db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500').all().map(mapAuditLog),
};

module.exports = { db, UserDB, DoctorDB, PatientDB, IllnessDB, AppointmentDB, AuditDB };
