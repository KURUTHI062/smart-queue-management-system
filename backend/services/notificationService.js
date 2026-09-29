const { v4: uuidv4 } = require('uuid');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const socketManager = require('../sockets/socketManager');
const whatsappService = require('./whatsappService');

class NotificationService {
  async createAndSendNotification({
    patientId,
    type,
    title,
    message,
    metadata = {}
  }) {
    const notification = {
      id: uuidv4(),
      patient_id: patientId,
      type,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // 1. Save to DB / Memory
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert([notification]);
      } catch (err) {
        console.warn('⚠️ Supabase insert notification error:', err.message);
      }
    }
    memoryStore.notifications.unshift(notification);

    // 2. Targeted Socket.IO emission ONLY to this patient's private room
    socketManager.emitToPatient(patientId, 'notification:new', notification);

    if (type === 'YOUR_TURN') {
      const callPayload = {
        token: metadata.tokenNumber || notification.metadata?.tokenNumber,
        tokenNumber: metadata.tokenNumber || notification.metadata?.tokenNumber,
        doctor: metadata.doctorName,
        doctorName: metadata.doctorName,
        department: metadata.departmentName,
        departmentName: metadata.departmentName,
        room: metadata.roomNumber,
        roomNumber: metadata.roomNumber,
        message: notification.message,
        calledAt: metadata.calledAt || new Date().toISOString(),
        notificationId: notification.id
      };
      socketManager.emitToPatient(patientId, 'PATIENT_CALLED', callPayload);
      socketManager.emitToPatient(patientId, 'patient:called', callPayload);
    }

    // 3. WhatsApp dispatch if patient details provided
    if (metadata.mobile && metadata.whatsappOptIn !== false) {
      const patientName = metadata.patientName || 'Patient';
      try {
        switch (type) {
          case 'APPOINTMENT_CONFIRMED':
            await whatsappService.sendAppointmentConfirmation({
              patientName,
              mobile: metadata.mobile,
              doctorName: metadata.doctorName || 'Doctor',
              departmentName: metadata.departmentName || 'Clinic',
              appointmentDate: metadata.appointmentDate || 'Today',
              appointmentTime: metadata.appointmentTime || 'Scheduled Time',
              tokenNumber: metadata.tokenNumber || 'Token',
              patientId,
              optIn: metadata.whatsappOptIn
            });
            break;

          case 'TOKEN_GENERATED':
            await whatsappService.sendTokenGenerated({
              patientName,
              mobile: metadata.mobile,
              tokenNumber: metadata.tokenNumber || 'Token',
              priorityLabel: metadata.priorityLabel || 'Normal',
              queuePosition: metadata.queuePosition || 1,
              estimatedWait: metadata.estimatedWait || 15,
              patientId,
              optIn: metadata.whatsappOptIn
            });
            break;

          case 'TOKEN_APPROACHING':
            await whatsappService.sendTokenApproaching({
              patientName,
              mobile: metadata.mobile,
              tokenNumber: metadata.tokenNumber || 'Token',
              patientsAhead: metadata.patientsAhead || 1,
              roomNumber: metadata.roomNumber || 'Room',
              patientId,
              optIn: metadata.whatsappOptIn
            });
            break;

          case 'YOUR_TURN':
            await whatsappService.sendPatientCalled({
              patientName,
              mobile: metadata.mobile,
              tokenNumber: metadata.tokenNumber || 'Token',
              doctorName: metadata.doctorName || 'Doctor',
              departmentName: metadata.departmentName || 'Clinic',
              roomNumber: metadata.roomNumber || 'Room',
              patientId,
              optIn: metadata.whatsappOptIn
            });
            break;

          case 'APPOINTMENT_CANCELLED':
            await whatsappService.sendAppointmentCancelled({
              patientName,
              mobile: metadata.mobile,
              tokenNumber: metadata.tokenNumber || 'Token',
              doctorName: metadata.doctorName || 'Doctor',
              patientId,
              optIn: metadata.whatsappOptIn
            });
            break;

          default:
            break;
        }
      } catch (waErr) {
        console.error('WhatsApp dispatch error in notificationService:', waErr.message);
      }
    }

    return notification;
  }
}

module.exports = new NotificationService();
