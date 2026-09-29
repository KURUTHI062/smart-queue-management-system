-- =========================================================================
-- Smart Queue Management System for Hospital (SQMS)
-- Supabase / PostgreSQL Schema Definition
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (in reverse foreign-key order)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS queue CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password VARCHAR(255), -- backward-compatibility alias
    role VARCHAR(50) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    code VARCHAR(20) UNIQUE NOT NULL,
    token_prefix VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PATIENTS TABLE
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(30) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    address TEXT,
    emergency_contact VARCHAR(50),
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DOCTORS TABLE
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    specialization VARCHAR(200) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'OFF_DUTY')),
    avg_consultation_time INT DEFAULT 15, -- minutes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    reason TEXT,
    priority INT DEFAULT 4 CHECK (priority IN (1, 2, 3, 4)), -- 1=Emergency, 2=High, 3=Medium, 4=Normal
    status VARCHAR(50) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. QUEUE TABLE
CREATE TABLE queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    token_number VARCHAR(50) NOT NULL,
    priority INT DEFAULT 4 CHECK (priority IN (1, 2, 3, 4)), -- 1=Emergency, 2=High, 3=Medium, 4=Normal
    status VARCHAR(50) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'NO_SHOW', 'CANCELLED')),
    queue_position INT DEFAULT 0,
    estimated_wait_time INT DEFAULT 0, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL CHECK (type IN (
        'APPOINTMENT_CONFIRMED',
        'TOKEN_GENERATED',
        'QUEUE_UPDATED',
        'TOKEN_APPROACHING',
        'YOUR_TURN',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_COMPLETED'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTIFICATION_LOGS TABLE
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('WHATSAPP', 'SOCKET', 'SMS', 'EMAIL')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('DELIVERED', 'SENT', 'FAILED', 'DEMO_LOGGED')),
    recipient VARCHAR(255) NOT NULL,
    payload JSONB,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ultra-fast queue sorting and lookups
CREATE INDEX idx_queue_doctor_status_priority ON queue (doctor_id, status, priority ASC, created_at ASC);
CREATE INDEX idx_queue_department_status ON queue (department_id, status);
CREATE INDEX idx_appointments_date_doc ON appointments (doctor_id, appointment_date);
CREATE INDEX idx_notifications_patient ON notifications (patient_id, created_at DESC);
CREATE INDEX idx_users_email ON users (email);
