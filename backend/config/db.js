const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co' && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    isSupabaseConfigured = true;
    console.log('✅ Supabase client initialized with endpoint:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Supabase init error, running in Local-Memory Mode:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not set or using placeholder. Running in Local Mode with full demo seed.');
}

// In-Memory Fallback & Demo Store
const seedHash = bcrypt.hashSync('password123', 10);
const adminSmartCareHash = bcrypt.hashSync('Admin@SmartCare2026!', 10);
const doctorSmartCareHash = bcrypt.hashSync('Doctor@SmartCare2026!', 10);

const memoryStore = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000000',
      name: 'SmartCare Administrator',
      email: 'admin@smartcare.com',
      password: adminSmartCareHash,
      password_hash: adminSmartCareHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      mobile: '+919800000001',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Hospital Admin',
      email: 'admin@hospital.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      mobile: '+919876500001',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u1000000-0000-0000-0000-000000000000',
      name: 'Dr. Kumar',
      email: 'doctor@smartcare.com',
      password: doctorSmartCareHash,
      password_hash: doctorSmartCareHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      mobile: '+919876543200',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u1000000-0000-0000-0000-000000000001',
      name: 'Dr. Rajesh Kumar',
      email: 'dr.kumar@hospital.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      mobile: '+919876543210',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u1000000-0000-0000-0000-000000000002',
      name: 'Dr. Priya Sharma',
      email: 'dr.priya@hospital.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      mobile: '+919876543211',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u1000000-0000-0000-0000-000000000003',
      name: 'Dr. Arun Verma',
      email: 'dr.arun@hospital.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      mobile: '+919876543212',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u1000000-0000-0000-0000-000000000004',
      name: 'Dr. Meena Iyer',
      email: 'dr.meena@hospital.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      mobile: '+919876543213',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u2000000-0000-0000-0000-000000000001',
      name: 'Rahul Verma',
      email: 'rahul@gmail.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      mobile: '+919811223344',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u2000000-0000-0000-0000-000000000002',
      name: 'Priya Gupta',
      email: 'priya.sharma@gmail.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      mobile: '+919822334455',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u2000000-0000-0000-0000-000000000003',
      name: 'Anita Desai',
      email: 'anita.desai@gmail.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      mobile: '+919833445566',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u2000000-0000-0000-0000-000000000004',
      name: 'Amit Patel',
      email: 'amit.patel@gmail.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      mobile: '+919844556677',
      created_at: new Date(Date.now() - 36000000).toISOString()
    },
    {
      id: 'u2000000-0000-0000-0000-000000000005',
      name: 'Ravi Shankar',
      email: 'ravi@gmail.com',
      password: seedHash,
      password_hash: seedHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      mobile: '+919855667788',
      created_at: new Date(Date.now() - 36000000).toISOString()
    }
  ],
  departments: [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      name: 'Cardiology',
      description: 'Comprehensive heart & vascular diagnosis, preventive checkups, and interventions.',
      code: 'CARD',
      token_prefix: 'C',
      created_at: new Date().toISOString()
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      name: 'General Medicine',
      description: 'Primary healthcare, chronic disease management, fever, and routine medical consultations.',
      code: 'GEN',
      token_prefix: 'GM',
      created_at: new Date().toISOString()
    },
    {
      id: 'd3333333-3333-3333-3333-333333333333',
      name: 'Pediatrics',
      description: 'Expert pediatric care, neonatal care, developmental tracking, and vaccination.',
      code: 'PED',
      token_prefix: 'P',
      created_at: new Date().toISOString()
    },
    {
      id: 'd4444444-4444-4444-4444-444444444444',
      name: 'Orthopedics',
      description: 'Bone, joint, spine, sports injury, and musculoskeletal rehabilitation.',
      code: 'ORTHO',
      token_prefix: 'O',
      created_at: new Date().toISOString()
    },
    {
      id: 'd5555555-5555-5555-5555-555555555555',
      name: 'Dermatology',
      description: 'Advanced clinical and cosmetic dermatology for skin, hair, and nail health.',
      code: 'DERM',
      token_prefix: 'D',
      created_at: new Date().toISOString()
    },
    {
      id: 'd6666666-6666-6666-6666-666666666666',
      name: 'ENT',
      description: 'Ear, nose, and throat diagnostic procedures and specialized outpatient care.',
      code: 'ENT',
      token_prefix: 'E',
      created_at: new Date().toISOString()
    },
    {
      id: 'd7777777-7777-7777-7777-777777777777',
      name: 'Neurology',
      description: 'Disorders of the brain, spinal cord, nerves, and neurological conditions.',
      code: 'NEURO',
      token_prefix: 'N',
      created_at: new Date().toISOString()
    }
  ],
  doctors: [
    {
      id: 'doc00000-0000-0000-0000-000000000000',
      user_id: 'u1000000-0000-0000-0000-000000000000',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      specialization: 'Senior Cardiologist',
      room_number: 'Room 203',
      availability_status: 'AVAILABLE',
      avg_consultation_time: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'doc11111-1111-1111-1111-111111111111',
      user_id: 'u1000000-0000-0000-0000-000000000001',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      specialization: 'Senior Interventional Cardiologist',
      room_number: 'Room 203',
      availability_status: 'AVAILABLE',
      avg_consultation_time: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'doc22222-2222-2222-2222-222222222222',
      user_id: 'u1000000-0000-0000-0000-000000000002',
      department_id: 'd2222222-2222-2222-2222-222222222222',
      specialization: 'Senior General Physician & Diabetologist',
      room_number: 'Room 105',
      availability_status: 'AVAILABLE',
      avg_consultation_time: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 'doc33333-3333-3333-3333-333333333333',
      user_id: 'u1000000-0000-0000-0000-000000000003',
      department_id: 'd3333333-3333-3333-3333-333333333333',
      specialization: 'Consultant Pediatrician',
      room_number: 'Room 302',
      availability_status: 'AVAILABLE',
      avg_consultation_time: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'doc44444-4444-4444-4444-444444444444',
      user_id: 'u1000000-0000-0000-0000-000000000004',
      department_id: 'd4444444-4444-4444-4444-444444444444',
      specialization: 'Orthopedic & Joint Replacement Surgeon',
      room_number: 'Room 112',
      availability_status: 'AVAILABLE',
      avg_consultation_time: 20,
      created_at: new Date().toISOString()
    }
  ],
  patients: [
    {
      id: 'pat11111-1111-1111-1111-111111111111',
      user_id: 'u2000000-0000-0000-0000-000000000001',
      date_of_birth: '1990-05-14',
      gender: 'Male',
      address: '42 MG Road, Bangalore',
      emergency_contact: '+919811223300',
      whatsapp_opt_in: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'pat22222-2222-2222-2222-222222222222',
      user_id: 'u2000000-0000-0000-0000-000000000002',
      date_of_birth: '1995-11-20',
      gender: 'Female',
      address: '15 Park Street, Kolkata',
      emergency_contact: '+919822334400',
      whatsapp_opt_in: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'pat33333-3333-3333-3333-333333333333',
      user_id: 'u2000000-0000-0000-0000-000000000003',
      date_of_birth: '1982-03-08',
      gender: 'Female',
      address: '78 Sector 18, Noida',
      emergency_contact: '+919833445500',
      whatsapp_opt_in: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'pat44444-4444-4444-4444-444444444444',
      user_id: 'u2000000-0000-0000-0000-000000000004',
      date_of_birth: '1975-09-12',
      gender: 'Male',
      address: '102 Civil Lines, Jaipur',
      emergency_contact: '+919844556600',
      whatsapp_opt_in: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'pat55555-5555-5555-5555-555555555555',
      user_id: 'u2000000-0000-0000-0000-000000000005',
      date_of_birth: '1988-07-25',
      gender: 'Male',
      address: '55 Bandra West, Mumbai',
      emergency_contact: '+919855667700',
      whatsapp_opt_in: true,
      created_at: new Date().toISOString()
    }
  ],
  appointments: [
    {
      id: 'apt11111-1111-1111-1111-111111111111',
      patient_id: 'pat55555-5555-5555-5555-555555555555',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:30 AM',
      reason: 'Severe Chest Tightness and Shortness of Breath',
      priority: 1, // Emergency
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 40 * 60000).toISOString()
    },
    {
      id: 'apt22222-2222-2222-2222-222222222222',
      patient_id: 'pat22222-2222-2222-2222-222222222222',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00 AM',
      reason: 'Post-surgery review and ECG follow-up',
      priority: 2, // High
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 35 * 60000).toISOString()
    },
    {
      id: 'apt33333-3333-3333-3333-333333333333',
      patient_id: 'pat33333-3333-3333-3333-333333333333',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:30 AM',
      reason: 'Hypertension medication adjustment',
      priority: 3, // Medium
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: 'apt44444-4444-4444-4444-444444444444',
      patient_id: 'pat11111-1111-1111-1111-111111111111',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '11:00 AM',
      reason: 'Annual routine cardiac checkup',
      priority: 4, // Normal
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'apt55555-5555-5555-5555-555555555555',
      patient_id: 'pat44444-4444-4444-4444-444444444444',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '11:30 AM',
      reason: 'Mild palpitations during exercise',
      priority: 4, // Normal
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 20 * 60000).toISOString()
    }
  ],
  queue: [
    {
      id: 'que11111-1111-1111-1111-111111111111',
      appointment_id: 'apt11111-1111-1111-1111-111111111111',
      patient_id: 'pat55555-5555-5555-5555-555555555555',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      token_number: 'C-001',
      priority: 1,
      status: 'WAITING',
      queue_position: 1,
      estimated_wait_time: 0,
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      called_at: null,
      completed_at: null
    },
    {
      id: 'que22222-2222-2222-2222-222222222222',
      appointment_id: 'apt22222-2222-2222-2222-222222222222',
      patient_id: 'pat22222-2222-2222-2222-222222222222',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      token_number: 'C-002',
      priority: 2,
      status: 'WAITING',
      queue_position: 2,
      estimated_wait_time: 15,
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
      called_at: null,
      completed_at: null
    },
    {
      id: 'que33333-3333-3333-3333-333333333333',
      appointment_id: 'apt33333-3333-3333-3333-333333333333',
      patient_id: 'pat33333-3333-3333-3333-333333333333',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      token_number: 'C-003',
      priority: 3,
      status: 'WAITING',
      queue_position: 3,
      estimated_wait_time: 30,
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      called_at: null,
      completed_at: null
    },
    {
      id: 'que44444-4444-4444-4444-444444444444',
      appointment_id: 'apt44444-4444-4444-4444-444444444444',
      patient_id: 'pat11111-1111-1111-1111-111111111111',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      token_number: 'C-004',
      priority: 4,
      status: 'WAITING',
      queue_position: 4,
      estimated_wait_time: 45,
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      called_at: null,
      completed_at: null
    },
    {
      id: 'que55555-5555-5555-5555-555555555555',
      appointment_id: 'apt55555-5555-5555-5555-555555555555',
      patient_id: 'pat44444-4444-4444-4444-444444444444',
      doctor_id: 'doc11111-1111-1111-1111-111111111111',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      token_number: 'C-005',
      priority: 4,
      status: 'WAITING',
      queue_position: 5,
      estimated_wait_time: 60,
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
      called_at: null,
      completed_at: null
    }
  ],
  notifications: [
    {
      id: 'notif111-1111-1111-1111-111111111111',
      patient_id: 'pat11111-1111-1111-1111-111111111111',
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Rajesh Kumar (Cardiology) is confirmed for today at 11:00 AM.',
      is_read: true,
      created_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'notif222-2222-2222-2222-222222222222',
      patient_id: 'pat11111-1111-1111-1111-111111111111',
      type: 'TOKEN_GENERATED',
      title: 'Token Generated: C-004',
      message: 'Your queue token C-004 has been generated. Priority level: Normal. Estimated wait time: ~45 mins.',
      is_read: false,
      created_at: new Date(Date.now() - 24 * 60000).toISOString()
    }
  ],
  notification_logs: [],
  priority_config: {
    emergencyWeight: 1,
    highWeight: 2,
    mediumWeight: 3,
    normalWeight: 4,
    avgConsultationMinutes: 15,
    autoBumpAfterMinutes: 45
  }
};

module.exports = {
  supabase,
  isSupabaseConfigured,
  memoryStore
};
