const { v4: uuidv4 } = require('uuid');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { PRIORITY, QUEUE_STATUS, APPOINTMENT_STATUS, NOTIFICATION_TYPES, PRIORITY_LABELS } = require('../config/constants');
const queueEngine = require('../services/queueEngine');
const notificationService = require('../services/notificationService');
const socketManager = require('../sockets/socketManager');

// POST /api/appointments (Book appointment)
const bookAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      departmentId,
      appointmentDate,
      appointmentTime,
      reason,
      priority = PRIORITY.NORMAL,
      customPatientId = null
    } = req.body;

    // 1. Resolve & authenticate patient (Never trust frontend patientId for standard patients)
    let patientId = null;
    if (req.user?.role === 'PATIENT') {
      patientId = req.patient?.id;
      if (!patientId) {
        if (isSupabaseConfigured && supabase) {
          const { data: p } = await supabase.from('patients').select('id').eq('user_id', req.user.id).maybeSingle();
          patientId = p?.id;
        } else {
          const p = memoryStore.patients.find(pat => pat.user_id === req.user.id);
          patientId = p?.id;
        }
      }
    } else if (req.user?.role === 'ADMIN' || req.user?.role === 'DOCTOR') {
      patientId = customPatientId || req.patient?.id;
    }

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Authenticated patient profile not found. Please complete profile registration.' });
    }

    // 2. Validate required inputs
    if (!doctorId || !departmentId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Doctor, Department, Date and Time slot are required.' });
    }

    // 3. Validate Department exists
    let department = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('departments').select('*').eq('id', departmentId).maybeSingle();
      department = data;
    } else {
      department = memoryStore.departments.find(d => d.id === departmentId);
    }
    if (!department) {
      return res.status(404).json({ success: false, message: 'Selected department does not exist.' });
    }

    // 4. Validate Doctor exists and belongs to selected Department
    let doctor = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('doctors').select('*, users(name)').eq('id', doctorId).maybeSingle();
      doctor = data;
    } else {
      doctor = memoryStore.doctors.find(d => d.id === doctorId);
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor does not exist.' });
    }
    if (doctor.department_id !== departmentId) {
      return res.status(400).json({ success: false, message: 'Selected doctor does not belong to the selected department.' });
    }

    // 5. Validate appointment date (Must not be in the past)
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate < todayStr) {
      return res.status(400).json({ success: false, message: 'Appointment date cannot be in the past.' });
    }

    // 6. Prevent Duplicate Booking (Same patient with same doctor on same date while active)
    let existingActive = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', appointmentDate)
        .in('status', ['BOOKED', 'CONFIRMED'])
        .maybeSingle();
      existingActive = data;
    } else {
      existingActive = memoryStore.appointments.find(a =>
        a.patient_id === patientId &&
        a.doctor_id === doctorId &&
        a.appointment_date === appointmentDate &&
        ['BOOKED', 'CONFIRMED'].includes(a.status)
      );
    }

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `You already have an active appointment scheduled with this doctor on ${appointmentDate} at ${existingActive.appointment_time}.`
      });
    }

    // 7. Determine priority level (Enforce hospital rules: Patient cannot arbitrarily claim Emergency unless verified/authorized)
    let finalPriority = PRIORITY.NORMAL; // default P4
    if (req.user?.role === 'ADMIN' || req.user?.role === 'DOCTOR') {
      finalPriority = Number(priority) || PRIORITY.NORMAL;
    } else {
      // Auto-detect triage keywords from patient reason for hospital triage evaluation
      const lowerReason = (reason || '').toLowerCase();
      if (lowerReason.includes('chest pain') || lowerReason.includes('breathing difficulty') || lowerReason.includes('heart attack') || lowerReason.includes('severe trauma')) {
        finalPriority = PRIORITY.EMERGENCY;
      } else if (lowerReason.includes('severe bleeding') || lowerReason.includes('fracture') || lowerReason.includes('high fever infant')) {
        finalPriority = PRIORITY.HIGH;
      }
    }
    if (finalPriority < 1 || finalPriority > 4) finalPriority = PRIORITY.NORMAL;

    const appointmentId = uuidv4();
    const queueId = uuidv4();
    const createdAt = new Date().toISOString();

    // 8. Generate unique token for this department queue
    const tokenNumber = await queueEngine.generateToken(departmentId, doctorId);

    // 9. Create appointment record
    const newAppointment = {
      id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      department_id: departmentId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      reason: reason || 'General Consultation',
      priority: finalPriority,
      status: APPOINTMENT_STATUS.CONFIRMED,
      created_at: createdAt,
      updated_at: createdAt
    };

    // 10. Create queue entry
    const newQueueItem = {
      id: queueId,
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      department_id: departmentId,
      token_number: tokenNumber,
      priority: finalPriority,
      status: QUEUE_STATUS.WAITING,
      queue_position: 0, // will be computed in reindex
      estimated_wait_time: 0,
      created_at: createdAt,
      called_at: null,
      completed_at: null
    };

    // Persist to DB or memory
    if (isSupabaseConfigured && supabase) {
      const { error: aErr } = await supabase.from('appointments').insert([newAppointment]);
      if (aErr) throw aErr;
      const { error: qErr } = await supabase.from('queue').insert([newQueueItem]);
      if (qErr) throw qErr;
    } else {
      memoryStore.appointments.unshift(newAppointment);
      memoryStore.queue.push(newQueueItem);
    }

    // 11. Re-index queue and compute exact positions & dynamic wait times
    const sortedQueue = await queueEngine.reindexQueue(doctorId);
    const myQueueEntry = sortedQueue.find(q => q.id === queueId) || newQueueItem;

    // 12. Gather metadata for alerts
    const metadata = await queueEngine.getPatientMetadata(patientId, doctorId);
    const priorityInfo = PRIORITY_LABELS[finalPriority] || { label: 'Normal' };

    // 13. Create Notifications
    await notificationService.createAndSendNotification({
      patientId,
      type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${metadata.doctorName} (${metadata.departmentName}) is confirmed for ${appointmentDate} at ${appointmentTime}.`,
      metadata: {
        ...metadata,
        appointmentDate,
        appointmentTime,
        tokenNumber
      }
    });

    await notificationService.createAndSendNotification({
      patientId,
      type: NOTIFICATION_TYPES.TOKEN_GENERATED,
      title: `Token Generated: ${tokenNumber}`,
      message: `Queue Token: ${tokenNumber} (${priorityInfo.label} Priority). Queue position: #${myQueueEntry.queue_position}. Estimated wait: ~${myQueueEntry.estimated_wait_time} mins.`,
      metadata: {
        ...metadata,
        tokenNumber,
        priorityLabel: priorityInfo.label,
        queuePosition: myQueueEntry.queue_position,
        estimatedWait: myQueueEntry.estimated_wait_time
      }
    });

    // 14. Emit Socket.IO queue broadcast
    socketManager.emitQueueUpdate({
      doctor_id: doctorId,
      department_id: departmentId,
      action: 'BOOKED',
      tokenNumber
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully and token issued!',
      data: {
        appointment: newAppointment,
        queue: myQueueEntry,
        tokenNumber,
        priorityLabel: priorityInfo.label,
        queuePosition: myQueueEntry.queue_position,
        estimatedWaitTime: myQueueEntry.estimated_wait_time
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/my
const getMyAppointments = async (req, res, next) => {
  try {
    const patientId = req.patient?.id;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient profile not found' });
    }

    let appointments = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctors(*, users(name), departments(name)), queue(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      appointments = data || [];
    } else {
      appointments = memoryStore.appointments
        .filter(a => a.patient_id === patientId)
        .map(a => {
          const doc = memoryStore.doctors.find(d => d.id === a.doctor_id);
          const docUser = doc ? memoryStore.users.find(u => u.id === doc.user_id) : null;
          const dept = memoryStore.departments.find(dep => dep.id === a.department_id);
          const queueItem = memoryStore.queue.find(q => q.appointment_id === a.id);
          return {
            ...a,
            doctor_name: docUser?.name || 'Dr. Specialist',
            room_number: doc?.room_number || 'Room 101',
            department_name: dept?.name || 'Department',
            token_number: queueItem?.token_number,
            queue_status: queueItem?.status,
            queue_position: queueItem?.queue_position,
            estimated_wait_time: queueItem?.estimated_wait_time
          };
        });
    }

    return res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let appointment = null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctors(*, users(name), departments(name)), queue(*), patients(*, users(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      appointment = data;
    } else {
      const a = memoryStore.appointments.find(item => item.id === id);
      if (a) {
        const doc = memoryStore.doctors.find(d => d.id === a.doctor_id);
        const docUser = doc ? memoryStore.users.find(u => u.id === doc.user_id) : null;
        const dept = memoryStore.departments.find(dep => dep.id === a.department_id);
        const pat = memoryStore.patients.find(p => p.id === a.patient_id);
        const patUser = pat ? memoryStore.users.find(u => u.id === pat.user_id) : null;
        const queueItem = memoryStore.queue.find(q => q.appointment_id === a.id);

        appointment = {
          ...a,
          doctor_name: docUser?.name,
          department_name: dept?.name,
          room_number: doc?.room_number,
          patient_name: patUser?.name,
          patient_mobile: patUser?.mobile,
          token_number: queueItem?.token_number,
          queue_status: queueItem?.status,
          queue_position: queueItem?.queue_position,
          estimated_wait_time: queueItem?.estimated_wait_time
        };
      }
    }

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    return res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/appointments/:id/cancel
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    let appointment = null;
    let queueItem = null;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('appointments').update({ status: APPOINTMENT_STATUS.CANCELLED }).eq('id', id).select().single();
      appointment = data;
      if (appointment) {
        const { data: qData } = await supabase.from('queue').update({ status: QUEUE_STATUS.CANCELLED }).eq('appointment_id', id).select().single();
        queueItem = qData;
      }
    } else {
      const idx = memoryStore.appointments.findIndex(a => a.id === id);
      if (idx !== -1) {
        memoryStore.appointments[idx].status = APPOINTMENT_STATUS.CANCELLED;
        appointment = memoryStore.appointments[idx];

        const qIdx = memoryStore.queue.findIndex(q => q.appointment_id === id);
        if (qIdx !== -1) {
          memoryStore.queue[qIdx].status = QUEUE_STATUS.CANCELLED;
          queueItem = memoryStore.queue[qIdx];
        }
      }
    }

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (queueItem?.doctor_id) {
      await queueEngine.reindexQueue(queueItem.doctor_id);
    }

    const metadata = await queueEngine.getPatientMetadata(appointment.patient_id, appointment.doctor_id);
    await notificationService.createAndSendNotification({
      patientId: appointment.patient_id,
      type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
      title: 'Appointment Cancelled',
      message: `Your appointment (Token: ${queueItem?.token_number || 'N/A'}) has been cancelled.`,
      metadata: {
        ...metadata,
        tokenNumber: queueItem?.token_number
      }
    });

    socketManager.emitQueueUpdate({
      doctor_id: appointment.doctor_id,
      department_id: appointment.department_id,
      action: 'CANCELLED'
    });

    return res.json({ success: true, message: 'Appointment successfully cancelled' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment
};
