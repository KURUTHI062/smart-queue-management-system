const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { PRIORITY, QUEUE_STATUS, NOTIFICATION_TYPES, PRIORITY_LABELS } = require('../config/constants');
const socketManager = require('../sockets/socketManager');
const notificationService = require('./notificationService');
const { v4: uuidv4 } = require('uuid');

class QueueEngine {
  /**
   * Generates a department-prefixed unique token number (e.g., C-006, GM-002)
   */
  async generateToken(departmentId, doctorId = null) {
    let department = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('departments').select('*').eq('id', departmentId).single();
      department = data;
    }
    if (!department) {
      department = memoryStore.departments.find(d => d.id === departmentId) || { token_prefix: 'T' };
    }

    const prefix = department.token_prefix || 'T';

    // Count existing tokens for this department today
    const today = new Date().toISOString().split('T')[0];
    let count = 0;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .select('token_number')
        .eq('department_id', departmentId)
        .gte('created_at', `${today}T00:00:00.000Z`);
      count = (data || []).length;
    } else {
      count = memoryStore.queue.filter(q => 
        q.department_id === departmentId && 
        q.created_at.startsWith(today)
      ).length;
    }

    const nextNumber = count + 1;
    const formattedNumber = String(nextNumber).padStart(3, '0');
    return `${prefix}-${formattedNumber}`;
  }

  /**
   * Sort queue strictly by:
   * 1. Priority (1 = Emergency, 2 = High, 3 = Medium, 4 = Normal)
   * 2. Creation time (earliest first)
   * 3. Token sequence
   */
  sortQueue(queueItems) {
    return [...queueItems].sort((a, b) => {
      // 1. Priority comparison
      const priorityA = Number(a.priority) || PRIORITY.NORMAL;
      const priorityB = Number(b.priority) || PRIORITY.NORMAL;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 2. Creation / arrival time comparison
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // 3. Token number fallback
      return (a.token_number || '').localeCompare(b.token_number || '');
    });
  }

  /**
   * Recalculates queue positions and estimated wait times for waiting patients
   */
  async reindexQueue(doctorId) {
    let doctor = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
      doctor = data;
    }
    if (!doctor) {
      doctor = memoryStore.doctors.find(d => d.id === doctorId) || { avg_consultation_time: 15 };
    }
    const avgMinutes = doctor.avg_consultation_time || 15;

    // Get all WAITING queue items for this doctor
    let waitingItems = [];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', QUEUE_STATUS.WAITING);
      waitingItems = data || [];
    } else {
      waitingItems = memoryStore.queue.filter(
        q => q.doctor_id === doctorId && q.status === QUEUE_STATUS.WAITING
      );
    }

    // Sort using our strict priority algorithm
    const sorted = this.sortQueue(waitingItems);

    // Update positions and wait times
    for (let index = 0; index < sorted.length; index++) {
      const item = sorted[index];
      const newPos = index + 1;
      const newWait = index * avgMinutes;

      item.queue_position = newPos;
      item.estimated_wait_time = newWait;

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('queue')
          .update({ queue_position: newPos, estimated_wait_time: newWait })
          .eq('id', item.id);
      } else {
        const memIdx = memoryStore.queue.findIndex(q => q.id === item.id);
        if (memIdx !== -1) {
          memoryStore.queue[memIdx].queue_position = newPos;
          memoryStore.queue[memIdx].estimated_wait_time = newWait;
        }
      }

      // If patient is next or approaching (pos === 2), trigger token approaching alert if not sent
      if (newPos === 2) {
        const patientDetails = await this.getPatientMetadata(item.patient_id, doctorId);
        if (patientDetails) {
          await notificationService.createAndSendNotification({
            patientId: item.patient_id,
            type: NOTIFICATION_TYPES.TOKEN_APPROACHING,
            title: `Your Token ${item.token_number} is Next!`,
            message: `There is only 1 patient ahead of you. Please be ready outside ${patientDetails.roomNumber}.`,
            metadata: {
              ...patientDetails,
              tokenNumber: item.token_number,
              patientsAhead: 1
            }
          });
        }
      }
    }

    return sorted;
  }

  /**
   * Helper to fetch joined metadata (Patient user, Doctor user, Department)
   */
  async getPatientMetadata(patientId, doctorId = null) {
    let patient = null;
    let user = null;
    let doctor = null;
    let doctorUser = null;
    let department = null;

    if (isSupabaseConfigured && supabase) {
      const { data: patData } = await supabase.from('patients').select('*, users(*)').eq('id', patientId).single();
      patient = patData;
      user = patData?.users;
      if (doctorId) {
        const { data: docData } = await supabase.from('doctors').select('*, users(*), departments(*)').eq('id', doctorId).single();
        doctor = docData;
        doctorUser = docData?.users;
        department = docData?.departments;
      }
    } else {
      patient = memoryStore.patients.find(p => p.id === patientId);
      user = patient ? memoryStore.users.find(u => u.id === patient.user_id) : null;
      if (doctorId) {
        doctor = memoryStore.doctors.find(d => d.id === doctorId);
        doctorUser = doctor ? memoryStore.users.find(u => u.id === doctor.user_id) : null;
        department = doctor ? memoryStore.departments.find(dep => dep.id === doctor.department_id) : null;
      }
    }

    return {
      patientName: user?.name || 'Valued Patient',
      mobile: user?.mobile || '',
      whatsappOptIn: patient?.whatsapp_opt_in !== false,
      doctorName: doctorUser?.name || 'Doctor',
      departmentName: department?.name || 'Department',
      roomNumber: doctor?.room_number || 'Room 101'
    };
  }

  /**
   * CRITICAL ACTION: CALL NEXT PATIENT
   */
  async callNextPatient(doctorId) {
    // 1. Fetch WAITING queue items for this doctor
    let waitingList = [];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', QUEUE_STATUS.WAITING);
      waitingList = data || [];
    } else {
      waitingList = memoryStore.queue.filter(
        q => q.doctor_id === doctorId && q.status === QUEUE_STATUS.WAITING
      );
    }

    if (!waitingList || waitingList.length === 0) {
      return { success: false, message: 'No waiting patients in queue for this doctor.' };
    }

    // 2. Priority Queue Algorithm Selection:
    // Sort strictly by Priority ASC (1=Emergency first) -> Created At ASC -> Token
    const sortedWaiting = this.sortQueue(waitingList);
    const selectedItem = sortedWaiting[0];

    // Check if there was a previously CALLED patient for this doctor and mark as IN_CONSULTATION or COMPLETED
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.IN_CONSULTATION })
        .eq('doctor_id', doctorId)
        .eq('status', QUEUE_STATUS.CALLED);
    } else {
      memoryStore.queue.forEach(q => {
        if (q.doctor_id === doctorId && q.status === QUEUE_STATUS.CALLED) {
          q.status = QUEUE_STATUS.IN_CONSULTATION;
        }
      });
    }

    // 3. Mark selected patient as CALLED and set called_at
    const calledAt = new Date().toISOString();
    selectedItem.status = QUEUE_STATUS.CALLED;
    selectedItem.called_at = calledAt;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.CALLED, called_at: calledAt })
        .eq('id', selectedItem.id);
    } else {
      const memIdx = memoryStore.queue.findIndex(q => q.id === selectedItem.id);
      if (memIdx !== -1) {
        memoryStore.queue[memIdx].status = QUEUE_STATUS.CALLED;
        memoryStore.queue[memIdx].called_at = calledAt;
      }
    }

    // 4. Fetch metadata for targeted alerts
    const metadata = await this.getPatientMetadata(selectedItem.patient_id, doctorId);

    // 5. Send targeted notification ONLY to this patient
    await notificationService.createAndSendNotification({
      patientId: selectedItem.patient_id,
      type: NOTIFICATION_TYPES.YOUR_TURN,
      title: '🚨 YOUR TURN NOW!',
      message: `Token ${selectedItem.token_number} is now being called by ${metadata.doctorName} at ${metadata.roomNumber} (${metadata.departmentName}). Please proceed immediately.`,
      metadata: {
        ...metadata,
        tokenNumber: selectedItem.token_number,
        priority: selectedItem.priority,
        calledAt
      }
    });

    // 6. Broadcast general public call event for TV Display and doctor console
    socketManager.emitPatientCalledBroadcast({
      queueId: selectedItem.id,
      tokenNumber: selectedItem.token_number,
      doctorName: metadata.doctorName,
      departmentName: metadata.departmentName,
      departmentId: selectedItem.department_id,
      doctorId: selectedItem.doctor_id,
      roomNumber: metadata.roomNumber,
      priority: selectedItem.priority,
      calledAt
    });

    // 7. Re-index remaining queue positions and notify subscribers
    await this.reindexQueue(doctorId);
    socketManager.emitQueueUpdate({
      doctor_id: doctorId,
      department_id: selectedItem.department_id,
      action: 'CALLED',
      calledToken: selectedItem.token_number
    });

    return {
      success: true,
      message: `Token ${selectedItem.token_number} called successfully.`,
      currentPatient: {
        ...selectedItem,
        ...metadata
      }
    };
  }

  /**
   * Recall the currently called patient (resends notification & audio pulse)
   */
  async recallPatient(queueId) {
    let item = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('queue').select('*').eq('id', queueId).single();
      item = data;
    } else {
      item = memoryStore.queue.find(q => q.id === queueId);
    }

    if (!item) {
      return { success: false, message: 'Queue record not found' };
    }

    const calledAt = new Date().toISOString();
    item.called_at = calledAt;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('queue').update({ called_at: calledAt }).eq('id', queueId);
    }

    const metadata = await this.getPatientMetadata(item.patient_id, item.doctor_id);

    await notificationService.createAndSendNotification({
      patientId: item.patient_id,
      type: NOTIFICATION_TYPES.YOUR_TURN,
      title: '🚨 RECALL: YOUR TURN!',
      message: `Reminder: Token ${item.token_number} is waiting at ${metadata.roomNumber} (${metadata.doctorName}).`,
      metadata: {
        ...metadata,
        tokenNumber: item.token_number,
        calledAt
      }
    });

    socketManager.emitPatientCalledBroadcast({
      queueId: item.id,
      tokenNumber: item.token_number,
      doctorName: metadata.doctorName,
      departmentName: metadata.departmentName,
      departmentId: item.department_id,
      doctorId: item.doctor_id,
      roomNumber: metadata.roomNumber,
      priority: item.priority,
      calledAt,
      isRecall: true
    });

    return { success: true, message: `Patient ${item.token_number} recalled successfully.` };
  }

  /**
   * Start Consultation (moves status from CALLED to IN_CONSULTATION)
   */
  async startConsultation(queueId) {
    let item = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.IN_CONSULTATION })
        .eq('id', queueId)
        .select()
        .single();
      item = data;
    } else {
      const memIdx = memoryStore.queue.findIndex(q => q.id === queueId);
      if (memIdx !== -1) {
        memoryStore.queue[memIdx].status = QUEUE_STATUS.IN_CONSULTATION;
        item = memoryStore.queue[memIdx];
      }
    }

    if (!item) return { success: false, message: 'Queue item not found' };

    await this.reindexQueue(item.doctor_id);
    socketManager.emitQueueUpdate({
      doctor_id: item.doctor_id,
      department_id: item.department_id,
      action: 'IN_CONSULTATION',
      tokenNumber: item.token_number
    });

    return { success: true, message: `Consultation started for token ${item.token_number}.`, data: item };
  }

  /**
   * Complete Consultation
   */
  async completePatient(queueId) {
    const completedAt = new Date().toISOString();
    let item = null;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.COMPLETED, completed_at: completedAt })
        .eq('id', queueId)
        .select()
        .single();
      item = data;
      if (item?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'COMPLETED' })
          .eq('id', item.appointment_id);
      }
    } else {
      const memIdx = memoryStore.queue.findIndex(q => q.id === queueId);
      if (memIdx !== -1) {
        memoryStore.queue[memIdx].status = QUEUE_STATUS.COMPLETED;
        memoryStore.queue[memIdx].completed_at = completedAt;
        item = memoryStore.queue[memIdx];

        const aptIdx = memoryStore.appointments.findIndex(a => a.id === item.appointment_id);
        if (aptIdx !== -1) {
          memoryStore.appointments[aptIdx].status = 'COMPLETED';
        }
      }
    }

    if (!item) return { success: false, message: 'Queue item not found' };

    const metadata = await this.getPatientMetadata(item.patient_id, item.doctor_id);

    await notificationService.createAndSendNotification({
      patientId: item.patient_id,
      type: NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
      title: 'Consultation Completed',
      message: `Your consultation with ${metadata.doctorName} has concluded. Thank you for visiting Smart Queue Hospital!`,
      metadata
    });

    await this.reindexQueue(item.doctor_id);
    socketManager.emitQueueUpdate({
      doctor_id: item.doctor_id,
      department_id: item.department_id,
      action: 'COMPLETED',
      tokenNumber: item.token_number
    });

    return { success: true, message: 'Consultation completed.' };
  }

  /**
   * Skip Patient (moves or sets status to SKIPPED)
   */
  async skipPatient(queueId) {
    let item = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.SKIPPED })
        .eq('id', queueId)
        .select()
        .single();
      item = data;
    } else {
      const memIdx = memoryStore.queue.findIndex(q => q.id === queueId);
      if (memIdx !== -1) {
        memoryStore.queue[memIdx].status = QUEUE_STATUS.SKIPPED;
        item = memoryStore.queue[memIdx];
      }
    }

    if (!item) return { success: false, message: 'Queue item not found' };

    await this.reindexQueue(item.doctor_id);
    socketManager.emitQueueUpdate({
      doctor_id: item.doctor_id,
      department_id: item.department_id,
      action: 'SKIPPED',
      tokenNumber: item.token_number
    });

    return { success: true, message: `Token ${item.token_number} marked as skipped.` };
  }

  /**
   * Mark as No Show
   */
  async noShowPatient(queueId) {
    let item = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('queue')
        .update({ status: QUEUE_STATUS.NO_SHOW })
        .eq('id', queueId)
        .select()
        .single();
      item = data;
      if (item?.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'NO_SHOW' })
          .eq('id', item.appointment_id);
      }
    } else {
      const memIdx = memoryStore.queue.findIndex(q => q.id === queueId);
      if (memIdx !== -1) {
        memoryStore.queue[memIdx].status = QUEUE_STATUS.NO_SHOW;
        item = memoryStore.queue[memIdx];
        const aptIdx = memoryStore.appointments.findIndex(a => a.id === item.appointment_id);
        if (aptIdx !== -1) {
          memoryStore.appointments[aptIdx].status = 'NO_SHOW';
        }
      }
    }

    if (!item) return { success: false, message: 'Queue item not found' };

    await this.reindexQueue(item.doctor_id);
    socketManager.emitQueueUpdate({
      doctor_id: item.doctor_id,
      department_id: item.department_id,
      action: 'NO_SHOW',
      tokenNumber: item.token_number
    });

    return { success: true, message: `Token ${item.token_number} marked as No Show.` };
  }
}

module.exports = new QueueEngine();
