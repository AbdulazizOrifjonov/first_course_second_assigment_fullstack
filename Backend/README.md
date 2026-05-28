# CareTrack Backend — Qo'llanma

Node.js + Express + SQLite API server. Ma'lumotlar `caretrack.db` faylida saqlanadi.

## Talablar

- **Node.js 22.5 yoki undan yuqori** (`node -v` — masalan v22 LTS yoki v25)
- SQLite uchun alohida `better-sqlite3` o‘rnatish shart emas (Node ichidagi `node:sqlite` ishlatiladi)

## O'rnatish va ishga tushirish

Terminalda `Backend` papkasiga kiring:

```bash
cd Backend
npm install
npm start
```

Server ishga tushganda:

```
🚀 Server yugurmoqda: http://localhost:5000
```

Ishlab turgan paytda kod o'zgarishlarini avtomatik qayta yuklash uchun:

```bash
npm run dev
```

Boshqa port kerak bo'lsa:

```bash
set PORT=3001
npm start
```

(PowerShell: `$env:PORT=3001; npm start`)

---

## Demo hisoblar

| Login        | Parol      | Rol            | Ruxsat                          |
|-------------|------------|----------------|----------------------------------|
| `admin`     | `admin123` | administrator  | Hamma narsa (shifokor CRUD ham) |
| `doctor1`   | `doctor123`| klinitsist     | Bemorlar, kasalliklar           |
| `reception1`| `recep123` | qabulxona      | Bemorlar (ko'rish/qo'shish)     |

Birinchi marta ishga tushganda SQLite bazaga namuna (seed) ma'lumotlar yoziladi.

---

## API manzili

Asosiy URL: **`http://localhost:5000`**

Barcha himoyalangan so'rovlar uchun sarlavha:

```
Authorization: Bearer <token>
```

Token faqat **login** dan keyin beriladi.

---

## 1. Kirish (Login)

**POST** `/api/auth/login`

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Javob (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "admin",
    "fullName": "Dr. Administrator",
    "createdAt": "..."
  }
}
```

Keyingi barcha so'rovlarda `token` ni `Authorization` sarlavhasida yuboring.

---

## 2. Joriy foydalanuvchi

**GET** `/api/auth/me` — token tekshirish

---

## 3. Shifokorlar (`/api/doctors`)

| Metod  | Yo'l              | Kim uchun        | Vazifa              |
|--------|-------------------|------------------|---------------------|
| GET    | `/api/doctors`    | barcha kirganlar | Ro'yxat             |
| GET    | `/api/doctors/:id`| barcha kirganlar | Bitta shifokor      |
| POST   | `/api/doctors`    | **faqat admin**  | Yangi shifokor      |
| PUT    | `/api/doctors/:id`| **faqat admin**  | Tahrirlash          |
| DELETE | `/api/doctors/:id`| **faqat admin**  | O'chirish           |

Qidiruv: `GET /api/doctors?search=karimov`

**POST misol:**

```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "specialization": "Kardiologiya",
  "department": "Kardiologiya Bo'limi",
  "email": "a.valiyev@caretrack.uz",
  "phone": "+998 90 000 00 00",
  "licenseNumber": "UZ-MED-2024-0001",
  "status": "active"
}
```

---

## 4. Bemorlar (`/api/patients`)

| Metod  | Yo'l               | Kim uchun              |
|--------|--------------------|------------------------|
| GET    | `/api/patients`    | barcha kirganlar       |
| GET    | `/api/patients/:id`| barcha kirganlar       |
| POST   | `/api/patients`    | admin, klinitsist      |
| PUT    | `/api/patients/:id`| admin, klinitsist      |
| DELETE | `/api/patients/:id`| admin, klinitsist      |

Qo'shimcha: `?search=ism` yoki `?doctorId=doc1`

**POST misol:**

```json
{
  "firstName": "Sardor",
  "lastName": "Abdullayev",
  "dateOfBirth": "1985-03-15",
  "gender": "male",
  "bloodType": "A+",
  "email": "sardor@mail.uz",
  "phone": "+998 90 111 22 33",
  "address": "Toshkent",
  "emergencyContact": "Ota-ona",
  "emergencyPhone": "+998 90 222 33 44",
  "doctorId": "doc1",
  "status": "active"
}
```

---

## 5. Kasalliklar / tashxislar (`/api/illnesses`)

| Metod  | Yo'l                | Kim uchun         |
|--------|---------------------|-------------------|
| GET    | `/api/illnesses`    | barcha kirganlar  |
| POST   | `/api/illnesses`    | admin, klinitsist |
| PUT    | `/api/illnesses/:id`| admin, klinitsist |
| DELETE | `/api/illnesses/:id`| admin, klinitsist |

Qo'shimcha: `?patientId=pat1`

---

## 6. Audit jurnali (`/api/audit`)

**GET** `/api/audit` — barcha CREATE/UPDATE/DELETE yozuvlari (kirgan foydalanuvchi uchun).

---

## PowerShell bilan tez sinash

```powershell
# 1) Login
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST -Body '{"username":"admin","password":"admin123"}' `
  -ContentType "application/json"

$token = $login.token

# 2) Shifokorlar ro'yxati
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/doctors" -Headers $headers
```

## Postman / Thunder Client

1. `POST http://localhost:5000/api/auth/login` — body JSON (username, password)
2. Javobdagi `token` ni nusxalang
3. Boshqa so'rovlarda **Authorization → Bearer Token** ga qo'ying

---

## Frontend bilan bog'lash

Frontend alohida terminalda:

```bash
cd Frontend
npm install
npm run dev
```

Frontend API manzili odatda: `http://localhost:5000` (Vite proxy yoki `.env` orqali).

Ikkalasi bir vaqtda ishlashi kerak:

| Terminal 1      | Terminal 2       |
|----------------|------------------|
| `cd Backend`   | `cd Frontend`    |
| `npm start`    | `npm run dev`    |
| port **5000**  | port **5173**    |

Brauzerda: `http://localhost:5173`

---

## Fayl tuzilishi

```
Backend/
├── server.js          # Asosiy server
├── caretrack.db       # SQLite bazasi (birinchi ishga tushganda yaratiladi)
├── db/database.js     # Jadvalar, seed, CRUD
├── middleware/auth.js # JWT tekshiruv
└── routes/            # API yo'llari
    ├── auth.js
    ├── doctors.js
    ├── patients.js
    ├── illnesses.js
    └── audit.js
```

---

## Xatoliklar

| Kod | Ma'nosi                                      |
|-----|----------------------------------------------|
| 400 | Maydonlar to'liq emas                        |
| 401 | Token yo'q yoki noto'g'ri login              |
| 403 | Ruxsat yetarli emas (masalan, admin emas)    |
| 404 | Yozuv topilmadi                              |
| 409 | Email yoki litsenziya allaqachon mavjud      |
| 500 | Server xatosi (konsolga qarang)              |

Agar `npm install` xato bersa, Node.js ni qayta o'rnating yoki administrator sifatida terminal oching.

### `NODE_MODULE_VERSION` / `better-sqlite3` xatosi

Eski versiyada `better-sqlite3` Node versiyasi bilan mos kelmasligi mumkin edi. Hozir loyiha **Node ichidagi SQLite** dan foydalanadi. Agar baribir xato chiqsa:

```powershell
cd Backend
npm install
npm start
```

### `EADDRINUSE: port 5000`

Backend allaqachon ishlayapti. Yangi terminal ochish shart emas — yoki portni bo'shating:

```powershell
netstat -ano | findstr :5000
taskkill /PID <raqam> /F
npm start
```
