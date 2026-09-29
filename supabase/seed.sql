-- =========================================================================
-- Smart Queue Management System (SQMS) - Seed Data
-- Demo accounts with password 'password123':
-- Admin: admin@hospital.com
-- Doctors: dr.kumar@hospital.com, dr.priya@hospital.com, dr.arun@hospital.com, dr.meena@hospital.com
-- Patients: rahul@gmail.com, priya.sharma@gmail.com, anita.desai@gmail.com, amit.patel@gmail.com
-- =========================================================================

-- Standard bcrypt hash for 'password123'
-- $2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy

-- 1. DEPARTMENTS
INSERT INTO departments (id, name, description, code, token_prefix) VALUES
('d1111111-1111-1111-1111-111111111111', 'Cardiology', 'Heart and cardiovascular care, diagnostics and interventions.', 'CARD', 'C'),
('d2222222-2222-2222-2222-222222222222', 'General Medicine', 'Primary healthcare, diagnostic checkups, and routine consultations.', 'GEN', 'GM'),
('d3333333-3333-3333-3333-333333333333', 'Pediatrics', 'Comprehensive child healthcare, immunizations, and pediatric wellness.', 'PED', 'P'),
('d4444444-4444-4444-4444-444444444444', 'Orthopedics', 'Bone, joint, spine, and musculoskeletal care and trauma support.', 'ORTHO', 'O'),
('d5555555-5555-5555-5555-555555555555', 'Dermatology', 'Skin, hair, and cosmetic medical treatments and consultations.', 'DERM', 'D'),
('d6666666-6666-6666-6666-666666666666', 'ENT', 'Ear, Nose, and Throat specialized outpatient care.', 'ENT', 'E'),
('d7777777-7777-7777-7777-777777777777', 'Neurology', 'Brain, spinal cord, and nervous system diagnostic care.', 'NEURO', 'N')
ON CONFLICT (name) DO NOTHING;

-- 2. USERS
-- Admin (admin@smartcare.com / Admin@SmartCare2026!)
INSERT INTO users (id, name, email, password, role, mobile) VALUES
('a0000000-0000-0000-0000-000000000000', 'SmartCare Administrator', 'admin@smartcare.com', '$2b$10$Uq6Q03zBfvfR4sJjW3tWbOD6v1fJjEhzp4gRj.B7hP2E6xWj.5K7C', 'ADMIN', '+919800000001'),
('a0000000-0000-0000-0000-000000000001', 'Hospital Admin', 'admin@hospital.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'ADMIN', '+919876500001')
ON CONFLICT (email) DO NOTHING;

-- Doctors (doctor@smartcare.com / Doctor@SmartCare2026!)
INSERT INTO users (id, name, email, password, role, mobile) VALUES
('u1000000-0000-0000-0000-000000000000', 'Dr. Kumar', 'doctor@smartcare.com', '$2b$10$Fw4gH.J3Yq2d0v8r5kL9b.zQ1t8U6iJ4xG9rP0aE3v7F8nN1m6qC2', 'DOCTOR', '+919876543200'),
('u1000000-0000-0000-0000-000000000001', 'Dr. Rajesh Kumar', 'dr.kumar@hospital.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'DOCTOR', '+919876543210'),
('u1000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma', 'dr.priya@hospital.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'DOCTOR', '+919876543211'),
('u1000000-0000-0000-0000-000000000003', 'Dr. Arun Verma', 'dr.arun@hospital.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'DOCTOR', '+919876543212'),
('u1000000-0000-0000-0000-000000000004', 'Dr. Meena Iyer', 'dr.meena@hospital.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'DOCTOR', '+919876543213')
ON CONFLICT (email) DO NOTHING;

-- Patients
INSERT INTO users (id, name, email, password, role, mobile) VALUES
('u2000000-0000-0000-0000-000000000001', 'Rahul Verma', 'rahul@gmail.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'PATIENT', '+919811223344'),
('u2000000-0000-0000-0000-000000000002', 'Priya Gupta', 'priya.sharma@gmail.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'PATIENT', '+919822334455'),
('u2000000-0000-0000-0000-000000000003', 'Anita Desai', 'anita.desai@gmail.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'PATIENT', '+919833445566'),
('u2000000-0000-0000-0000-000000000004', 'Amit Patel', 'amit.patel@gmail.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'PATIENT', '+919844556677'),
('u2000000-0000-0000-0000-000000000005', 'Ravi Shankar', 'ravi@gmail.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5o7CP09r6P4xy', 'PATIENT', '+919855667788')
ON CONFLICT (email) DO NOTHING;

-- 3. DOCTORS PROFILE
INSERT INTO doctors (id, user_id, department_id, specialization, room_number, availability_status, avg_consultation_time) VALUES
('doc11111-1111-1111-1111-111111111111', 'u1000000-0000-0000-0000-000000000001', 'd1111111-1111-1111-1111-111111111111', 'Senior Interventional Cardiologist', 'Room 203', 'AVAILABLE', 15),
('doc22222-2222-2222-2222-222222222222', 'u1000000-0000-0000-0000-000000000002', 'd2222222-2222-2222-2222-222222222222', 'Senior General Physician & Diabetologist', 'Room 105', 'AVAILABLE', 12),
('doc33333-3333-3333-3333-333333333333', 'u1000000-0000-0000-0000-000000000003', 'd3333333-3333-3333-3333-333333333333', 'Consultant Pediatrician', 'Room 302', 'AVAILABLE', 15),
('doc44444-4444-4444-4444-444444444444', 'u1000000-0000-0000-0000-000000000004', 'd4444444-4444-4444-4444-444444444444', 'Orthopedic & Joint Replacement Surgeon', 'Room 112', 'AVAILABLE', 20)
ON CONFLICT (id) DO NOTHING;

-- 4. PATIENTS PROFILE
INSERT INTO patients (id, user_id, date_of_birth, gender, address, emergency_contact, whatsapp_opt_in) VALUES
('pat11111-1111-1111-1111-111111111111', 'u2000000-0000-0000-0000-000000000001', '1990-05-14', 'Male', '42 MG Road, Bangalore', '+919811223300', TRUE),
('pat22222-2222-2222-2222-222222222222', 'u2000000-0000-0000-0000-000000000002', '1995-11-20', 'Female', '15 Park Street, Kolkata', '+919822334400', TRUE),
('pat33333-3333-3333-3333-333333333333', 'u2000000-0000-0000-0000-000000000003', '1982-03-08', 'Female', '78 Sector 18, Noida', '+919833445500', TRUE),
('pat44444-4444-4444-4444-444444444444', 'u2000000-0000-0000-0000-000000000004', '1975-09-12', 'Male', '102 Civil Lines, Jaipur', '+919844556600', TRUE),
('pat55555-5555-5555-5555-555555555555', 'u2000000-0000-0000-0000-000000000005', '1988-07-25', 'Male', '55 Bandra West, Mumbai', '+919855667700', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. SAMPLE APPOINTMENTS (Cardiology Queue Demo)
-- Ravi Shankar (Emergency Priority 1)
INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, priority, status) VALUES
('apt11111-1111-1111-1111-111111111111', 'pat55555-5555-5555-5555-555555555555', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE, '09:30 AM', 'Severe Chest Tightness and Shortness of Breath', 1, 'CONFIRMED'),
-- Priya Gupta (High Priority 2)
('apt22222-2222-2222-2222-222222222222', 'pat22222-2222-2222-2222-222222222222', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE, '10:00 AM', 'Post-surgery review and ECG follow-up', 2, 'CONFIRMED'),
-- Anita Desai (Medium Priority 3)
('apt33333-3333-3333-3333-333333333333', 'pat33333-3333-3333-3333-333333333333', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE, '10:30 AM', 'Hypertension medication adjustment', 3, 'CONFIRMED'),
-- Rahul Verma (Normal Priority 4)
('apt44444-4444-4444-4444-444444444444', 'pat11111-1111-1111-1111-111111111111', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE, '11:00 AM', 'Annual routine cardiac checkup', 4, 'CONFIRMED'),
-- Amit Patel (Normal Priority 4)
('apt55555-5555-5555-5555-555555555555', 'pat44444-4444-4444-4444-444444444444', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE, '11:30 AM', 'Mild palpitations during exercise', 4, 'CONFIRMED')
ON CONFLICT (id) DO NOTHING;

-- 6. QUEUE ENTRIES (Priority Sorted)
INSERT INTO queue (id, appointment_id, patient_id, doctor_id, department_id, token_number, priority, status, queue_position, estimated_wait_time, created_at) VALUES
('que11111-1111-1111-1111-111111111111', 'apt11111-1111-1111-1111-111111111111', 'pat55555-5555-5555-5555-555555555555', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'C-001', 1, 'WAITING', 1, 0, NOW() - INTERVAL '40 minutes'),
('que22222-2222-2222-2222-222222222222', 'apt22222-2222-2222-2222-222222222222', 'pat22222-2222-2222-2222-222222222222', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'C-002', 2, 'WAITING', 2, 15, NOW() - INTERVAL '35 minutes'),
('que33333-3333-3333-3333-333333333333', 'apt33333-3333-3333-3333-333333333333', 'pat33333-3333-3333-3333-333333333333', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'C-003', 3, 'WAITING', 3, 30, NOW() - INTERVAL '30 minutes'),
('que44444-4444-4444-4444-444444444444', 'apt44444-4444-4444-4444-444444444444', 'pat11111-1111-1111-1111-111111111111', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'C-004', 4, 'WAITING', 4, 45, NOW() - INTERVAL '25 minutes'),
('que55555-5555-5555-5555-555555555555', 'apt55555-5555-5555-5555-555555555555', 'pat44444-4444-4444-4444-444444444444', 'doc11111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'C-005', 4, 'WAITING', 5, 60, NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

-- 7. INITIAL NOTIFICATIONS FOR PATIENT RAHUL VERMA
INSERT INTO notifications (patient_id, type, title, message, is_read, created_at) VALUES
('pat11111-1111-1111-1111-111111111111', 'APPOINTMENT_CONFIRMED', 'Appointment Confirmed', 'Your appointment with Dr. Rajesh Kumar (Cardiology) is confirmed for today at 11:00 AM.', TRUE, NOW() - INTERVAL '25 minutes'),
('pat11111-1111-1111-1111-111111111111', 'TOKEN_GENERATED', 'Token Generated: C-004', 'Your queue token C-004 has been generated. Priority level: Normal. Estimated wait time: ~45 mins.', FALSE, NOW() - INTERVAL '24 minutes')
ON CONFLICT DO NOTHING;
