# SmartCare Hospital Smart Queue Management System (SQMS)

SmartCare SQMS is a complete, production-style Hospital Smart Queue and Emergency Triage Management Web Application built with **React (Vite)**, **Node.js/Express**, **Supabase PostgreSQL**, and **Socket.IO**.

---

## 🌟 Key Features

1. **User-Defined Patient Registration & Authentication:**
   - Full patient registration with secure password hashing (bcrypt).
   - Unified login with Email or Mobile Number + Password.
   - Strict role-based routing (`PATIENT`, `DOCTOR`, `ADMIN`).

2. **4-Tier Clinical Priority Queue:**
   - **P1 (Emergency)** $\rightarrow$ **P2 (High)** $\rightarrow$ **P3 (Medium)** $\rightarrow$ **P4 (Normal)**.
   - Higher-priority emergency tokens automatically jump to the front of the queue.
   - Dynamic estimated wait times based on live doctor velocity and patients ahead.

3. **Real-time Doctor Queue Console:**
   - **Call Next Patient:** Backend atomically selects the highest-priority patient, updates status to `CALLED`, sets `called_at`, sends a targeted private alert, and broadcasts to the TV Display.
   - **Start Consultation:** Transitions status to `IN_CONSULTATION` with live consultation timer.
   - **Recall Patient:** Triggers voice reminder and urgent visual pulse.
   - **Complete Consultation:** Advances the queue automatically.
   - **Skip & No-Show:** Re-indexes the queue in real time.

4. **Targeted Patient Privacy:**
   - Isolated Socket.IO room `patient:{patientId}` ensures only the summoned patient receives private `YOUR_TURN` / `PATIENT_CALLED` notifications.
   - Other waiting patients receive **zero** sensitive data leaks.

5. **Hospital TV / Public Queue Display (`/queue-display`):**
   - Live waiting room monitor showing `NOW SERVING` (Token, Room, Doctor) and `UPCOMING IN QUEUE`.
   - Web Audio chime + Web Speech voice synthesizer for audible hospital announcements.
   - Zero sensitive patient private information displayed.

6. **WhatsApp Notification System:**
   - Integrated `WHATSAPP_MODE=demo` and production WhatsApp Cloud API dispatcher.
   - Dispatches confirmation, token issuance, approaching token, and call notices.
   - Audit logging in `notification_logs` table.

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 18, Vite, React Router 6, TailwindCSS / Glassmorphism Design System, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express.js, Socket.IO, JWT, bcryptjs, Morgan.
- **Database:** Supabase PostgreSQL (with automatic in-memory fallback for local demo).
- **Real-time:** WebSockets (Socket.IO).

---

## 🔑 Development Accounts (Pre-seeded)

### 1. Hospital Administrator
- **Email:** `admin@smartcare.com` (or `admin@hospital.com`)
- **Password:** `Admin@SmartCare2026!` (or `password123`)
- **Portal:** `/admin-dashboard`

### 2. Medical Doctor (Cardiology - Room 203)
- **Email:** `doctor@smartcare.com` (or `dr.kumar@hospital.com`)
- **Password:** `Doctor@SmartCare2026!` (or `password123`)
- **Portal:** `/doctor-dashboard`

### 3. Patient Self-Registration
- Register freely at `/register` or login with test accounts like `rahul@gmail.com` (`password123`).

---

## 🚀 Getting Started Locally

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run start
```
Backend runs on `http://localhost:5000`.

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Run Automated End-to-End Test Suite
```bash
cd backend
node scripts/testE2EFlow.js
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
JWT_SECRET=sqms_jwt_super_secret_key_2026

# Supabase (Optional - runs in Local-Memory mode if not provided)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# WhatsApp (Optional - runs in demo mode by default)
WHATSAPP_MODE=demo
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-id
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🧪 Real-World Acceptance Test Flow (4-Browser Demonstration)

1. **Browser 1 (Patient A):** Log in $\rightarrow$ Book consultation with symptoms "Severe chest pain" $\rightarrow$ Assigned Emergency `P1` token (`C-008`).
2. **Browser 2 (Patient B):** Log in $\rightarrow$ Book consultation for routine checkup $\rightarrow$ Assigned Normal `P4` token (`C-007`).
3. **Browser 3 (Doctor Console):** Log in $\rightarrow$ Observe Patient A placed at **Position #1** ahead of Patient B $\rightarrow$ Click **CALL NEXT PATIENT**.
4. **Browser 4 (Queue Display):** Instant real-time update to **NOW SERVING: C-008** with voice calling.
5. **Targeted Notification:** Patient A receives the popup notification; Patient B receives **zero** private leaks.
6. **Consultation Lifecycle:** Doctor clicks **Start Consultation** $\rightarrow$ status becomes `IN_CONSULTATION` $\rightarrow$ Doctor clicks **Complete** $\rightarrow$ Patient B automatically becomes **Position #1**.
