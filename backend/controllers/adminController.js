const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { QUEUE_STATUS, APPOINTMENT_STATUS, PRIORITY } = require('../config/constants');

// GET /api/admin/statistics
const getStatistics = async (req, res, next) => {
  try {
    let totalPatients = 0;
    let todayAppointments = 0;
    let waitingPatients = 0;
    let doctorsAvailable = 0;
    let completedConsultations = 0;
    let emergencyCases = 0;

    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured && supabase) {
      const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      totalPatients = pCount || 0;

      const { count: aCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today);
      todayAppointments = aCount || 0;

      const { count: wCount } = await supabase.from('queue').select('*', { count: 'exact', head: true }).eq('status', QUEUE_STATUS.WAITING);
      waitingPatients = wCount || 0;

      const { count: dCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('availability_status', 'AVAILABLE');
      doctorsAvailable = dCount || 0;

      const { count: cCount } = await supabase.from('queue').select('*', { count: 'exact', head: true }).eq('status', QUEUE_STATUS.COMPLETED);
      completedConsultations = cCount || 0;

      const { count: eCount } = await supabase.from('queue').select('*', { count: 'exact', head: true }).eq('priority', PRIORITY.EMERGENCY);
      emergencyCases = eCount || 0;
    } else {
      totalPatients = memoryStore.patients.length;
      todayAppointments = memoryStore.appointments.filter(a => a.appointment_date === today).length;
      waitingPatients = memoryStore.queue.filter(q => q.status === QUEUE_STATUS.WAITING).length;
      doctorsAvailable = memoryStore.doctors.filter(d => d.availability_status === 'AVAILABLE').length;
      completedConsultations = memoryStore.queue.filter(q => q.status === QUEUE_STATUS.COMPLETED).length;
      emergencyCases = memoryStore.queue.filter(q => q.priority === PRIORITY.EMERGENCY && q.status === QUEUE_STATUS.WAITING).length;
    }

    return res.json({
      success: true,
      data: {
        totalPatients,
        todayAppointments,
        waitingPatients,
        doctorsAvailable,
        completedConsultations,
        emergencyCases
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/patients
const getPatients = async (req, res, next) => {
  try {
    let patients = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('patients').select('*, users(*)').order('created_at', { ascending: false });
      if (error) throw error;
      patients = (data || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        name: p.users?.name,
        email: p.users?.email,
        mobile: p.users?.mobile,
        date_of_birth: p.date_of_birth,
        gender: p.gender,
        address: p.address,
        emergency_contact: p.emergency_contact,
        whatsapp_opt_in: p.whatsapp_opt_in,
        created_at: p.created_at
      }));
    } else {
      patients = memoryStore.patients.map(p => {
        const user = memoryStore.users.find(u => u.id === p.user_id);
        const aptCount = memoryStore.appointments.filter(a => a.patient_id === p.id).length;
        return {
          id: p.id,
          user_id: p.user_id,
          name: user?.name || 'Patient',
          email: user?.email || '',
          mobile: user?.mobile || '',
          date_of_birth: p.date_of_birth,
          gender: p.gender,
          address: p.address,
          emergency_contact: p.emergency_contact,
          whatsapp_opt_in: p.whatsapp_opt_in,
          appointment_count: aptCount,
          created_at: p.created_at
        };
      });
    }

    return res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports
const getReports = async (req, res, next) => {
  try {
    let queueItems = memoryStore.queue;
    let appointments = memoryStore.appointments;
    let departments = memoryStore.departments;

    // Department breakdown
    const departmentBreakdown = departments.map(dept => {
      const deptApts = appointments.filter(a => a.department_id === dept.id);
      const completed = queueItems.filter(q => q.department_id === dept.id && q.status === QUEUE_STATUS.COMPLETED).length;
      const waiting = queueItems.filter(q => q.department_id === dept.id && q.status === QUEUE_STATUS.WAITING).length;

      return {
        id: dept.id,
        name: dept.name,
        totalAppointments: deptApts.length,
        completed,
        waiting
      };
    });

    // Priority breakdown
    const priorityDistribution = {
      Emergency: queueItems.filter(q => q.priority === 1).length,
      High: queueItems.filter(q => q.priority === 2).length,
      Medium: queueItems.filter(q => q.priority === 3).length,
      Normal: queueItems.filter(q => q.priority === 4).length
    };

    // Status metrics
    const completedCount = queueItems.filter(q => q.status === QUEUE_STATUS.COMPLETED).length;
    const noShowCount = queueItems.filter(q => q.status === QUEUE_STATUS.NO_SHOW).length;
    const cancelledCount = appointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED).length;
    const totalServedOrWaiting = queueItems.length || 1;

    // Compute average estimated wait time
    const waitingList = queueItems.filter(q => q.status === QUEUE_STATUS.WAITING);
    const avgWaitTime = waitingList.length > 0 
      ? Math.round(waitingList.reduce((acc, curr) => acc + (curr.estimated_wait_time || 0), 0) / waitingList.length)
      : 15;

    return res.json({
      success: true,
      data: {
        summary: {
          totalAppointments: appointments.length,
          completedConsultations: completedCount,
          noShowCount,
          cancelledCount,
          avgWaitTimeMinutes: avgWaitTime,
          noShowRatePercentage: Math.round((noShowCount / totalServedOrWaiting) * 100)
        },
        departmentBreakdown,
        priorityDistribution,
        recentLogs: memoryStore.notification_logs.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/priority-config
const updatePriorityConfig = (req, res) => {
  const { emergencyWeight, highWeight, mediumWeight, normalWeight, avgConsultationMinutes } = req.body;
  
  if (emergencyWeight) memoryStore.priority_config.emergencyWeight = Number(emergencyWeight);
  if (highWeight) memoryStore.priority_config.highWeight = Number(highWeight);
  if (mediumWeight) memoryStore.priority_config.mediumWeight = Number(mediumWeight);
  if (normalWeight) memoryStore.priority_config.normalWeight = Number(normalWeight);
  if (avgConsultationMinutes) memoryStore.priority_config.avgConsultationMinutes = Number(avgConsultationMinutes);

  return res.json({
    success: true,
    message: 'Priority configuration updated successfully',
    data: memoryStore.priority_config
  });
};

// GET /api/admin/notification-logs
const getNotificationLogs = (req, res) => {
  return res.json({
    success: true,
    count: memoryStore.notification_logs.length,
    data: memoryStore.notification_logs
  });
};

module.exports = {
  getStatistics,
  getPatients,
  getReports,
  updatePriorityConfig,
  getNotificationLogs
};
