const http = require('http');
const ioClient = require('socket.io-client');
const axios = require('axios');
const { app, server } = require('../server');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('================================================================');
  console.log('🧪 SMARTCARE SQMS END-TO-END WORKFLOW & REALTIME QUEUE TEST');
  console.log('================================================================\n');

  // Give server 500ms to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`✅ Test suite connecting to server on port ${PORT}`);

  try {
    // 1. Health check
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health check passed: [${healthRes.data.status}] Mode: ${healthRes.data.mode}`);

    // 2. Register Patient A
    const patientAData = {
      name: 'Patient Alpha (Emergency Case)',
      email: `patient_alpha_${Date.now()}@hospital.com`,
      mobile: `+91981${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      dateOfBirth: '1992-04-15',
      gender: 'Male',
      address: '101 Medical Center Blvd',
      emergencyContact: '+919811000001',
      whatsappOptIn: true
    };
    const regARes = await axios.post(`${BASE_URL}/auth/register`, patientAData);
    const tokenA = regARes.data.data.token;
    const patientAUser = regARes.data.data.user;
    const patientAProfile = regARes.data.data.patient;
    console.log(`✅ Patient A registered: ${patientAUser.name} (${patientAUser.email}), PatientID: ${patientAProfile.id}`);

    // 3. Register Patient B
    const patientBData = {
      name: 'Patient Beta (Routine Case)',
      email: `patient_beta_${Date.now()}@hospital.com`,
      mobile: `+91982${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      dateOfBirth: '1995-08-20',
      gender: 'Female',
      address: '202 Health Ave',
      emergencyContact: '+919822000002',
      whatsappOptIn: true
    };
    const regBRes = await axios.post(`${BASE_URL}/auth/register`, patientBData);
    const tokenB = regBRes.data.data.token;
    const patientBUser = regBRes.data.data.user;
    const patientBProfile = regBRes.data.data.patient;
    console.log(`✅ Patient B registered: ${patientBUser.name} (${patientBUser.email}), PatientID: ${patientBProfile.id}`);

    // 4. Admin Login and Create Dedicated Doctor
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin@hospital.com',
      password: 'password123'
    });
    const adminToken = adminLoginRes.data.data.token;
    console.log(`✅ Hospital Admin logged in: ${adminLoginRes.data.data.user.name}`);

    // Admin provisions new Doctor
    const newDocPayload = {
      name: 'Dr. Suresh Emergency Lead',
      email: `dr.suresh_${Date.now()}@hospital.com`,
      mobile: `+91983${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: 'DoctorPassword@123',
      department_id: 'd1111111-1111-1111-1111-111111111111',
      specialization: 'Chief of Emergency Cardiology',
      room_number: 'Room 204',
      avg_consultation_time: 15
    };
    const createDocRes = await axios.post(`${BASE_URL}/doctors`, newDocPayload, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const doctorId = createDocRes.data.data.id;
    const deptId = newDocPayload.department_id;
    console.log(`✅ Admin registered new Doctor: ${newDocPayload.name} (ID: ${doctorId})`);

    // Doctor Logs in with their own credentials
    const docLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: newDocPayload.email,
      password: newDocPayload.password
    });
    const doctorToken = docLoginRes.data.data.token;
    console.log(`✅ Newly created Doctor successfully logged in with personal credentials.`);

    // 5. Connect Realtime Sockets:
    // - Patient A Socket
    // - Patient B Socket
    // - TV Queue Display Socket
    console.log('\n--- Connecting 3 Real-time Socket Clients ---');
    const socketA = ioClient(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
    const socketB = ioClient(SOCKET_URL, { auth: { token: tokenB }, transports: ['websocket'] });
    const socketDisplay = ioClient(SOCKET_URL, { transports: ['websocket'] });

    let patientAReceivedCall = null;
    let patientBReceivedCall = null;
    let displayReceivedCall = null;
    let displayReceivedUpdate = null;

    await new Promise((resolve) => {
      let count = 0;
      const checkDone = () => { count++; if (count === 3) resolve(); };
      socketA.on('connect', () => {
        socketA.emit('patient:join', { patientId: patientAProfile.id });
        checkDone();
      });
      socketB.on('connect', () => {
        socketB.emit('patient:join', { patientId: patientBProfile.id });
        checkDone();
      });
      socketDisplay.on('connect', () => {
        socketDisplay.emit('display:join');
        checkDone();
      });
    });
    console.log('✅ All 3 Sockets connected & joined respective rooms.');

    socketA.on('PATIENT_CALLED', (data) => {
      patientAReceivedCall = data;
    });
    socketA.on('patient:called', (data) => {
      if (!patientAReceivedCall) patientAReceivedCall = data;
    });

    socketB.on('PATIENT_CALLED', (data) => {
      patientBReceivedCall = data;
    });
    socketB.on('patient:called', (data) => {
      patientBReceivedCall = data;
    });

    socketDisplay.on('patient:called', (data) => {
      displayReceivedCall = data;
    });
    socketDisplay.on('queue:update', (data) => {
      displayReceivedUpdate = data;
    });

    // 6. Patient B books FIRST (Routine checkup -> Priority 4 Normal)
    console.log('\n--- Booking Appointments ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const aptBRes = await axios.post(
      `${BASE_URL}/appointments`,
      {
        doctorId,
        departmentId: deptId,
        appointmentDate: todayStr,
        appointmentTime: '11:00 AM',
        reason: 'Routine annual checkup, feeling fine',
        priority: 4
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const tokenBNumber = aptBRes.data.data.tokenNumber;
    console.log(`✅ Patient B booked appointment FIRST: Token [${tokenBNumber}], Priority: ${aptBRes.data.data.priorityLabel} (P4)`);

    // 7. Patient A books SECOND (Severe chest pain -> Trigger Emergency Priority 1)
    const aptARes = await axios.post(
      `${BASE_URL}/appointments`,
      {
        doctorId,
        departmentId: deptId,
        appointmentDate: todayStr,
        appointmentTime: '11:30 AM',
        reason: 'Severe chest pain radiating to left arm and breathing difficulty',
        priority: 1
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const tokenANumber = aptARes.data.data.tokenNumber;
    console.log(`✅ Patient A booked appointment SECOND: Token [${tokenANumber}], Priority: ${aptARes.data.data.priorityLabel} (P1 Emergency)`);

    // 8. Verify Priority Queue Ordering
    console.log('\n--- Checking Priority Queue Order ---');
    const doctorQueueRes = await axios.get(`${BASE_URL}/queue/doctor/${doctorId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const waitingList = doctorQueueRes.data.data.waiting;
    console.log(`Queue items count: ${waitingList.length}`);
    waitingList.forEach((q, idx) => {
      console.log(`  Position #${idx + 1}: Token [${q.token_number}], Priority: ${q.priority}, Patient: ${q.patient_name}`);
    });

    // Patient A MUST be position #1 even though they booked SECOND, because P1 preempts P4
    if (waitingList[0].token_number !== tokenANumber) {
      throw new Error(`Queue ordering failed! Expected Emergency Token ${tokenANumber} at position #1, but got ${waitingList[0].token_number}`);
    }
    if (waitingList[1].token_number !== tokenBNumber) {
      throw new Error(`Queue ordering failed! Expected Normal Token ${tokenBNumber} at position #2, but got ${waitingList[1].token_number}`);
    }
    console.log(`🏆 VERIFIED: Emergency Patient A (${tokenANumber}, P1) preempted Patient B (${tokenBNumber}, P4) and is at Position #1!`);

    // 9. Doctor calls next patient
    console.log('\n--- Doctor Calls Next Patient ---');
    const callRes = await axios.post(
      `${BASE_URL}/queue/call-next`,
      { doctorId },
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log(`Doctor Call-Next API response: ${callRes.data.message}`);

    // Wait 500ms for websocket events to be received
    await new Promise((r) => setTimeout(r, 600));

    // Verify Socket events
    console.log('\n--- Verifying Targeted Real-time Notifications ---');
    if (!patientAReceivedCall) {
      throw new Error('❌ Patient A did NOT receive targeted YOUR_TURN / PATIENT_CALLED notification!');
    }
    console.log(`✅ Patient A received private YOUR_TURN notification for Token: ${patientAReceivedCall.tokenNumber || patientAReceivedCall.token}`);

    if (patientBReceivedCall) {
      throw new Error('❌ SECURITY VIOLATION: Patient B received private notification intended for Patient A!');
    }
    console.log(`🔒 VERIFIED: Patient B did NOT receive Patient A\'s private notification!`);

    if (!displayReceivedCall) {
      throw new Error('❌ TV Queue Display did NOT receive public patient:called announcement!');
    }
    console.log(`📺 VERIFIED: TV Queue Display received announcement for Token: ${displayReceivedCall.tokenNumber} in Room: ${displayReceivedCall.roomNumber}`);

    // 10. Doctor Starts Consultation
    const currentCalledItem = callRes.data.currentPatient;
    console.log(`\n--- Doctor Starts Consultation for Token ${currentCalledItem.token_number} ---`);
    const startRes = await axios.post(
      `${BASE_URL}/queue/${currentCalledItem.id}/start`,
      {},
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log(`✅ Consultation started: ${startRes.data.message}`);

    // 11. Doctor Completes Consultation
    console.log(`--- Doctor Completes Consultation for Token ${currentCalledItem.token_number} ---`);
    const completeRes = await axios.post(
      `${BASE_URL}/queue/${currentCalledItem.id}/complete`,
      {},
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
    console.log(`✅ Consultation completed: ${completeRes.data.message}`);

    // 12. Verify Patient B is now Position #1
    const updatedQueueRes = await axios.get(`${BASE_URL}/queue/doctor/${doctorId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const updatedWaiting = updatedQueueRes.data.data.waiting;
    console.log(`Next patient in queue is now: Token [${updatedWaiting[0]?.token_number}] (${updatedWaiting[0]?.patient_name})`);
    if (updatedWaiting[0]?.token_number !== tokenBNumber) {
      throw new Error(`Expected Token ${tokenBNumber} to be next, but found ${updatedWaiting[0]?.token_number}`);
    }
    console.log(`✅ VERIFIED: Queue advanced smoothly to Patient B!`);

    // 13. Security Tests
    console.log('\n--- Running Security Authorization Tests ---');
    // Test A: Patient attempts to call doctor call-next
    try {
      await axios.post(
        `${BASE_URL}/queue/call-next`,
        { doctorId },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      throw new Error('❌ SECURITY FAILED: Patient was able to call doctor call-next API!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('🔒 Security Check 1 Passed: Patient denied access to doctor call-next (403 Forbidden).');
      } else {
        throw err;
      }
    }

    // Test B: Unauthenticated request to /api/appointments/my
    try {
      await axios.get(`${BASE_URL}/appointments/my`);
      throw new Error('❌ SECURITY FAILED: Unauthenticated request was allowed!');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('🔒 Security Check 2 Passed: Unauthenticated request denied (401 Unauthorized).');
      } else {
        throw err;
      }
    }

    // Clean up sockets & server
    socketA.disconnect();
    socketB.disconnect();
    socketDisplay.disconnect();
    server.close();

    console.log('\n================================================================');
    console.log('🎉 ALL END-TO-END ACCEPTANCE & REALTIME SECURITY TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.response?.data || error.message);
    server.close();
    process.exit(1);
  }
}

runTests();
