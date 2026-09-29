const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 SMARTCARE SQMS - COMPREHENSIVE AUTH & SECURITY TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Patient A Self-Registration
    // -------------------------------------------------------------
    console.log('📌 Test 1: Patient A Self-Registration');
    const patientAData = {
      name: 'Ananya Sharma',
      email: `ananya.${Date.now()}@gmail.com`,
      mobile: `+919811${Math.floor(100000 + Math.random() * 900000)}`,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      dateOfBirth: '1998-05-14',
      gender: 'Female',
      address: 'Flat 402, Green Meadows, MG Road, Bengaluru',
      emergencyContact: '+919811000000',
      whatsappOptIn: true
    };

    const regRes = await axios.post(`${API_BASE}/auth/register`, patientAData);
    assert(regRes.data.success === true, 'Patient A registration succeeded');
    assert(regRes.data.data.token && typeof regRes.data.data.token === 'string', 'JWT token issued upon registration');
    assert(regRes.data.data.user.role === 'PATIENT', 'User assigned PATIENT role');
    assert(regRes.data.data.user.password === undefined && regRes.data.data.user.password_hash === undefined, 'No password or hash returned in response');
    assert(regRes.data.data.patient && regRes.data.data.patient.address.includes('Green Meadows'), 'Patient profile linked and persisted');

    const patientAToken = regRes.data.data.token;
    const patientAUser = regRes.data.data.user;

    // -------------------------------------------------------------
    // TEST 2: User-Defined Login via Email
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: User-Defined Login via Email');
    const loginEmailRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: patientAData.email,
      password: patientAData.password
    });
    assert(loginEmailRes.data.success === true, 'Login via Email succeeded');
    assert(loginEmailRes.data.data.user.id === patientAUser.id, 'Correct user profile returned');

    // -------------------------------------------------------------
    // TEST 3: User-Defined Login via Mobile Number
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: User-Defined Login via Mobile Number');
    const loginMobileRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: patientAData.mobile,
      password: patientAData.password
    });
    assert(loginMobileRes.data.success === true, 'Login via Mobile Number succeeded');
    assert(loginMobileRes.data.data.user.name === patientAData.name, 'Authenticated user matching mobile identity');

    // -------------------------------------------------------------
    // TEST 4: Invalid Password Rejection
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Invalid Password Rejection');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        identifier: patientAData.email,
        password: 'WrongPassword999'
      });
      assert(false, 'Should have rejected invalid password');
    } catch (err) {
      assert(err.response?.status === 401, 'Invalid password rejected with HTTP 401');
      assert(err.response?.data?.message.includes('Invalid'), 'Error message is clear and safe');
    }

    // -------------------------------------------------------------
    // TEST 5: Duplicate Email Registration Rejection
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Duplicate Email Rejection');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        ...patientAData,
        mobile: `+919877${Math.floor(100000 + Math.random() * 900000)}`
      });
      assert(false, 'Should have rejected duplicate email');
    } catch (err) {
      assert(err.response?.status === 400, 'Duplicate email rejected with HTTP 400');
      assert(err.response?.data?.message.includes('email'), 'Error message specifies duplicate email');
    }

    // -------------------------------------------------------------
    // TEST 6: Duplicate Mobile Registration Rejection
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Duplicate Mobile Rejection');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        ...patientAData,
        email: `different.${Date.now()}@example.com`
      });
      assert(false, 'Should have rejected duplicate mobile');
    } catch (err) {
      assert(err.response?.status === 400, 'Duplicate mobile rejected with HTTP 400');
      assert(err.response?.data?.message.includes('mobile'), 'Error message specifies duplicate mobile');
    }

    // -------------------------------------------------------------
    // TEST 7: Patient B Registration & Distinct Login
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Patient B Registration & Distinct Identity');
    const patientBData = {
      name: 'Vikram Sengupta',
      email: `vikram.${Date.now()}@gmail.com`,
      mobile: `+919822${Math.floor(100000 + Math.random() * 900000)}`,
      password: 'VikramSecretPass456!',
      confirmPassword: 'VikramSecretPass456!',
      dateOfBirth: '1985-11-20',
      gender: 'Male',
      address: 'House 12, Park Street, Kolkata',
      emergencyContact: '+919822000000',
      whatsappOptIn: true
    };
    const regBRes = await axios.post(`${API_BASE}/auth/register`, patientBData);
    assert(regBRes.data.success === true, 'Patient B registered successfully');
    assert(regBRes.data.data.user.id !== patientAUser.id, 'Patient B has unique UUID');

    // -------------------------------------------------------------
    // TEST 8: Session Rehydration & Verification (/api/auth/me)
    // -------------------------------------------------------------
    console.log('\n📌 Test 8: Session Persistence & Rehydration (/api/auth/me)');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(meRes.data.success === true, 'Session rehydration succeeded');
    assert(meRes.data.data.user.id === patientAUser.id, 'Authenticated user rehydrated accurately');
    assert(meRes.data.data.patient && meRes.data.data.patient.date_of_birth === '1998-05-14', 'Linked patient record rehydrated');

    // -------------------------------------------------------------
    // TEST 9: Update Profile
    // -------------------------------------------------------------
    console.log('\n📌 Test 9: Update Patient Profile');
    const updateProfRes = await axios.put(`${API_BASE}/auth/profile`, {
      name: 'Ananya Sharma-Roy',
      address: 'Flat 505, Palm Towers, Indiranagar, Bengaluru'
    }, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(updateProfRes.data.success === true, 'Profile updated successfully');

    const checkMeRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(checkMeRes.data.data.user.name === 'Ananya Sharma-Roy', 'Name updated in user record');
    assert(checkMeRes.data.data.patient.address.includes('Palm Towers'), 'Address updated in patient record');

    // -------------------------------------------------------------
    // TEST 10: Change Password Flow
    // -------------------------------------------------------------
    console.log('\n📌 Test 10: Change Password Flow');
    const newPass = 'UpdatedSecurePassword789!';
    const changePassRes = await axios.post(`${API_BASE}/auth/change-password`, {
      currentPassword: patientAData.password,
      newPassword: newPass,
      confirmNewPassword: newPass
    }, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    });
    assert(changePassRes.data.success === true, 'Password changed successfully');

    // Verify old password fails
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        identifier: patientAData.email,
        password: patientAData.password
      });
      assert(false, 'Old password should no longer work');
    } catch (err) {
      assert(err.response?.status === 401, 'Old password rejected');
    }

    // Verify new password succeeds
    const newPassLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: patientAData.email,
      password: newPass
    });
    assert(newPassLogin.data.success === true, 'Login with new password succeeded');

    // -------------------------------------------------------------
    // TEST 11: Role Authorization & Protection
    // -------------------------------------------------------------
    console.log('\n📌 Test 11: Role Authorization & Route Protection');
    // Patient attempting Admin endpoint
    try {
      await axios.get(`${API_BASE}/admin/statistics`, {
        headers: { Authorization: `Bearer ${patientAToken}` }
      });
      assert(false, 'Patient should NOT access /admin/statistics');
    } catch (err) {
      assert(err.response?.status === 403, 'Patient blocked from Admin API with HTTP 403 Forbidden');
    }

    // Patient attempting Doctor action
    try {
      await axios.post(`${API_BASE}/queue/call-next`, {}, {
        headers: { Authorization: `Bearer ${patientAToken}` }
      });
      assert(false, 'Patient should NOT access /queue/call-next');
    } catch (err) {
      assert(err.response?.status === 403, 'Patient blocked from Doctor call-next with HTTP 403 Forbidden');
    }

    // -------------------------------------------------------------
    // TEST 12: Admin Login & Doctor Creation
    // -------------------------------------------------------------
    console.log('\n📌 Test 12: Admin Login & Doctor Account Creation');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'admin@hospital.com',
      password: 'password123'
    });
    assert(adminLoginRes.data.success === true, 'Admin logged in');
    assert(adminLoginRes.data.data.user.role === 'ADMIN', 'Admin role verified');
    const adminToken = adminLoginRes.data.data.token;

    // Fetch department
    const deptRes = await axios.get(`${API_BASE}/departments`);
    const cardDept = deptRes.data.data.find(d => d.code === 'CARD') || deptRes.data.data[0];

    const newDoctorData = {
      name: 'Dr. Siddharth Sen',
      email: `dr.sen.${Date.now()}@hospital.com`,
      mobile: `+919988${Math.floor(100000 + Math.random() * 900000)}`,
      password: 'DoctorSenPass2026!',
      department_id: cardDept.id,
      specialization: 'Senior Cardiovascular Surgeon',
      room_number: 'Room 304',
      avg_consultation_time: 20
    };

    const createDocRes = await axios.post(`${API_BASE}/doctors`, newDoctorData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(createDocRes.data.success === true, 'Admin created new doctor account');

    // Doctor Login with their user-defined credentials
    const docLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: newDoctorData.email,
      password: newDoctorData.password
    });
    assert(docLoginRes.data.success === true, 'New Doctor logged in successfully');
    assert(docLoginRes.data.data.user.role === 'DOCTOR', 'User authenticated with DOCTOR role');
    const docToken = docLoginRes.data.data.token;

    // Doctor attempting to access Admin endpoint
    try {
      await axios.get(`${API_BASE}/admin/statistics`, {
        headers: { Authorization: `Bearer ${docToken}` }
      });
      assert(false, 'Doctor should NOT access Admin routes');
    } catch (err) {
      assert(err.response?.status === 403, 'Doctor blocked from Admin endpoint with HTTP 403 Forbidden');
    }

    // -------------------------------------------------------------
    // TEST 13: Forgot & Reset Password Flow
    // -------------------------------------------------------------
    console.log('\n📌 Test 13: Forgot & Reset Password Flow');
    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      identifier: patientBData.email
    });
    assert(forgotRes.data.success === true, 'Forgot password request processed safely');
    const resetCode = forgotRes.data.devToken;
    assert(resetCode !== undefined, 'Reset verification code issued');

    const resetPassNew = 'ResetVikramPass999!';
    const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
      resetCode,
      newPassword: resetPassNew,
      confirmNewPassword: resetPassNew
    });
    assert(resetRes.data.success === true, 'Password reset succeeded with code');

    const resetLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: patientBData.email,
      password: resetPassNew
    });
    assert(resetLoginRes.data.success === true, 'Login with reset password succeeded');

    // -------------------------------------------------------------
    // TEST 14: Socket.IO Authentication & Room Verification
    // -------------------------------------------------------------
    console.log('\n📌 Test 14: Socket.IO Authenticated Handshake');
    await new Promise((resolve) => {
      const socket = io(SOCKET_URL, {
        auth: { token: patientAToken },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        assert(socket.connected === true, 'Authenticated Socket.IO handshake connected');
        socket.emit('patient:join', { patientId: patientAUser.id });
        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 500);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connect error:', err);
        resolve();
      });
    });

  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests();
