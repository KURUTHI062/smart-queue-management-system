const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { QUEUE_STATUS, PRIORITY_LABELS } = require('../config/constants');
const queueEngine = require('../services/queueEngine');

// GET /api/queue (Public live queue / TV display)
const getQueue = async (req, res, next) => {
  try {
    const { departmentId, doctorId } = req.query;

    let items = [];
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('queue')
        .select('*, doctors(*, users(name), departments(name, token_prefix)), patients(*, users(name, mobile))')
        .in('status', [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (departmentId) query = query.eq('department_id', departmentId);
      if (doctorId) query = query.eq('doctor_id', doctorId);

      const { data, error } = await query;
      if (error) throw error;
      items = data || [];
    } else {
      let list = memoryStore.queue.filter(q =>
        [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION].includes(q.status)
      );
      if (departmentId) list = list.filter(q => q.department_id === departmentId);
      if (doctorId) list = list.filter(q => q.doctor_id === doctorId);

      items = list.map(q => {
        const doc = memoryStore.doctors.find(d => d.id === q.doctor_id);
        const docUser = doc ? memoryStore.users.find(u => u.id === doc.user_id) : null;
        const dept = memoryStore.departments.find(dep => dep.id === q.department_id);
        const pat = memoryStore.patients.find(p => p.id === q.patient_id);
        const patUser = pat ? memoryStore.users.find(u => u.id === pat.user_id) : null;

        return {
          ...q,
          doctor_name: docUser?.name || 'Dr. Specialist',
          room_number: doc?.room_number || 'Room 101',
          department_name: dept?.name || 'Clinic',
          token_prefix: dept?.token_prefix || 'T',
          patient_name: patUser?.name || 'Patient'
        };
      });
    }

    // Segregate into now serving vs waiting next
    const nowServing = items.filter(q => [QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION].includes(q.status));
    const waiting = queueEngine.sortQueue(items.filter(q => q.status === QUEUE_STATUS.WAITING));

    return res.json({
      success: true,
      data: {
        nowServing,
        waiting,
        totalWaiting: waiting.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queue/my (Patient's active queue position)
const getMyQueue = async (req, res, next) => {
  try {
    const patientId = req.patient?.id;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient profile not found' });
    }

    // Find patient's latest active ticket
    let myActiveTicket = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      myActiveTicket = data;
    } else {
      myActiveTicket = memoryStore.queue
        .filter(q => q.patient_id === patientId && [QUEUE_STATUS.WAITING, QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION].includes(q.status))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    }

    if (!myActiveTicket) {
      return res.json({
        success: true,
        hasActiveQueue: false,
        message: 'No active queue token for today.'
      });
    }

    // Get current serving token for the same doctor/department
    let currentServing = null;
    let waitingList = [];

    if (isSupabaseConfigured && supabase) {
      const { data: servData } = await supabase
        .from('queue')
        .select('*')
        .eq('doctor_id', myActiveTicket.doctor_id)
        .in('status', [QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION])
        .limit(1)
        .maybeSingle();
      currentServing = servData;

      const { data: wList } = await supabase
        .from('queue')
        .select('*')
        .eq('doctor_id', myActiveTicket.doctor_id)
        .eq('status', QUEUE_STATUS.WAITING);
      waitingList = wList || [];
    } else {
      currentServing = memoryStore.queue.find(
        q => q.doctor_id === myActiveTicket.doctor_id && [QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION].includes(q.status)
      );
      waitingList = memoryStore.queue.filter(
        q => q.doctor_id === myActiveTicket.doctor_id && q.status === QUEUE_STATUS.WAITING
      );
    }

    // Sort waiting list by priority engine
    const sortedWaiting = queueEngine.sortQueue(waitingList);
    const myIndex = sortedWaiting.findIndex(q => q.id === myActiveTicket.id);
    const patientsAhead = myIndex >= 0 ? myIndex : 0;

    const metadata = await queueEngine.getPatientMetadata(patientId, myActiveTicket.doctor_id);
    const priorityInfo = PRIORITY_LABELS[myActiveTicket.priority] || { label: 'Normal' };

    return res.json({
      success: true,
      hasActiveQueue: true,
      data: {
        ticket: myActiveTicket,
        tokenNumber: myActiveTicket.token_number,
        priority: myActiveTicket.priority,
        priorityLabel: priorityInfo.label,
        status: myActiveTicket.status,
        queuePosition: myIndex + 1,
        patientsAhead,
        estimatedWaitTime: myActiveTicket.estimated_wait_time || (patientsAhead * 15),
        currentServingToken: currentServing?.token_number || 'None',
        doctorName: metadata.doctorName,
        departmentName: metadata.departmentName,
        roomNumber: metadata.roomNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/queue/doctor/:doctorId (Doctor's dedicated queue console)
const getDoctorQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    // Security check: If authenticated user is a DOCTOR, they can only access their own queue (or ADMIN can access any)
    if (req.user.role === 'DOCTOR' && req.doctor && req.doctor.id !== doctorId) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot view another doctor’s queue.' });
    }

    let allDoctorQueue = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('queue')
        .select('*, patients(*, users(name, mobile, email))')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      allDoctorQueue = (data || []).map(q => ({
        ...q,
        patient_name: q.patients?.users?.name || 'Patient',
        patient_mobile: q.patients?.users?.mobile || 'N/A'
      }));
    } else {
      allDoctorQueue = memoryStore.queue
        .filter(q => q.doctor_id === doctorId)
        .map(q => {
          const pat = memoryStore.patients.find(p => p.id === q.patient_id);
          const patUser = pat ? memoryStore.users.find(u => u.id === pat.user_id) : null;
          return {
            ...q,
            patient_name: patUser?.name || 'Patient',
            patient_mobile: patUser?.mobile || 'N/A'
          };
        });
    }

    const waiting = queueEngine.sortQueue(allDoctorQueue.filter(q => q.status === QUEUE_STATUS.WAITING));
    const currentPatient = allDoctorQueue.find(q => [QUEUE_STATUS.CALLED, QUEUE_STATUS.IN_CONSULTATION].includes(q.status)) || null;
    const completed = allDoctorQueue.filter(q => q.status === QUEUE_STATUS.COMPLETED);
    const skipped = allDoctorQueue.filter(q => q.status === QUEUE_STATUS.SKIPPED);
    const noShow = allDoctorQueue.filter(q => q.status === QUEUE_STATUS.NO_SHOW);

    return res.json({
      success: true,
      data: {
        currentPatient,
        waiting,
        completed,
        skipped,
        noShow,
        totalWaiting: waiting.length,
        totalCompleted: completed.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/call-next (Doctor calls next patient)
const callNext = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    const targetDoctorId = doctorId || req.doctor?.id;

    if (!targetDoctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required.' });
    }

    if (req.user.role === 'DOCTOR' && req.doctor && req.doctor.id !== targetDoctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to call for another doctor.' });
    }

    const result = await queueEngine.callNextPatient(targetDoctorId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/:id/recall
const recall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await queueEngine.recallPatient(id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/:id/start
const startConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await queueEngine.startConsultation(id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/:id/skip
const skip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await queueEngine.skipPatient(id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/:id/complete
const complete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await queueEngine.completePatient(id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/queue/:id/no-show
const noShow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await queueEngine.noShowPatient(id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  getMyQueue,
  getDoctorQueue,
  callNext,
  recall,
  startConsultation,
  skip,
  complete,
  noShow
};
