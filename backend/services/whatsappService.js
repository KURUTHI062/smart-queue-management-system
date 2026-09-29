const axios = require('axios');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class WhatsAppService {
  constructor() {
    this.mode = process.env.WHATSAPP_MODE || 'demo';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  }

  async logNotification({ patientId, recipient, payload, status, response, channel = 'WHATSAPP' }) {
    const logEntry = {
      id: uuidv4(),
      patient_id: patientId || null,
      channel,
      status,
      recipient: recipient || 'Unknown',
      payload: payload || {},
      response: response || {},
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notification_logs').insert([logEntry]);
      } catch (err) {
        console.warn('⚠️ Failed to save notification log to Supabase:', err.message);
      }
    }
    // Also record in memoryStore for live admin logs
    memoryStore.notification_logs.unshift(logEntry);
    return logEntry;
  }

  async sendMessage({ toMobile, messageText, templateName = null, templateParams = [], patientId = null, optIn = true }) {
    if (!optIn) {
      console.log(`ℹ️ WhatsApp not sent: Patient opted out of WhatsApp messages.`);
      return { success: false, reason: 'OPTED_OUT' };
    }

    const recipient = toMobile || 'Unknown Mobile';

    if (this.mode === 'demo' || !this.accessToken || !this.phoneNumberId) {
      console.log('\n======================================================');
      console.log('📱 [WHATSAPP SERVICE - DEMO MODE DISPATCH]');
      console.log(`Recipient: ${recipient}`);
      console.log(`Template:  ${templateName || 'TEXT_MESSAGE'}`);
      console.log(`Message:\n${messageText}`);
      console.log('======================================================\n');

      await this.logNotification({
        patientId,
        recipient,
        payload: { messageText, templateName, templateParams },
        status: 'DEMO_LOGGED',
        response: { simulated: true, deliveredAt: new Date().toISOString() }
      });

      return { success: true, mode: 'demo', delivered: true };
    }

    try {
      // WhatsApp Cloud API Call
      const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
      
      let payload;
      if (templateName) {
        payload = {
          messaging_product: 'whatsapp',
          to: recipient.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: templateParams.length ? [{
              type: 'body',
              parameters: templateParams.map(param => ({ type: 'text', text: String(param) }))
            }] : []
          }
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient.replace(/\D/g, ''),
          type: 'text',
          text: { preview_url: false, body: messageText }
        };
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      await this.logNotification({
        patientId,
        recipient,
        payload,
        status: 'SENT',
        response: response.data
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ WhatsApp API Error:', error.response?.data || error.message);
      await this.logNotification({
        patientId,
        recipient,
        payload: { messageText, templateName },
        status: 'FAILED',
        response: error.response?.data || { error: error.message }
      });
      return { success: false, error: error.message };
    }
  }

  // 1. Send Appointment Confirmation
  async sendAppointmentConfirmation({ patientName, mobile, doctorName, departmentName, appointmentDate, appointmentTime, tokenNumber, patientId, optIn = true }) {
    const text = `🏥 *Smart Queue Hospital*\n\nHello ${patientName},\n\nYour appointment has been successfully booked!\n\n👨‍⚕️ *Doctor:* ${doctorName}\n🏥 *Department:* ${departmentName}\n📅 *Date:* ${appointmentDate}\n⏰ *Time:* ${appointmentTime}\n🎫 *Token:* ${tokenNumber}\n\nYou can track live queue updates on your patient portal.\n\nThank you for choosing Smart Queue Hospital.`;
    return this.sendMessage({
      toMobile: mobile,
      messageText: text,
      templateName: 'hospital_appointment_confirmed',
      templateParams: [patientName, doctorName, departmentName, appointmentDate, appointmentTime, tokenNumber],
      patientId,
      optIn
    });
  }

  // 2. Send Token Generated
  async sendTokenGenerated({ patientName, mobile, tokenNumber, priorityLabel, queuePosition, estimatedWait, patientId, optIn = true }) {
    const text = `🏥 *Smart Queue Hospital*\n\nHello ${patientName},\n\nYour live token is *${tokenNumber}* (${priorityLabel} Priority).\n📊 *Current Position in Queue:* #${queuePosition}\n⏳ *Estimated Wait Time:* ~${estimatedWait} mins\n\nWe will notify you immediately when your turn arrives.`;
    return this.sendMessage({
      toMobile: mobile,
      messageText: text,
      templateName: 'hospital_token_generated',
      templateParams: [patientName, tokenNumber, priorityLabel, queuePosition, estimatedWait],
      patientId,
      optIn
    });
  }

  // 3. Send Token Approaching
  async sendTokenApproaching({ patientName, mobile, tokenNumber, patientsAhead, roomNumber, patientId, optIn = true }) {
    const text = `🔔 *Smart Queue Hospital: Queue Alert*\n\nHello ${patientName},\n\nYour token *${tokenNumber}* is approaching soon!\nThere are only *${patientsAhead}* patient(s) ahead of you.\n🚪 *Room:* ${roomNumber}\n\nPlease remain near the consultation area.`;
    return this.sendMessage({
      toMobile: mobile,
      messageText: text,
      templateName: 'hospital_token_approaching',
      templateParams: [patientName, tokenNumber, patientsAhead, roomNumber],
      patientId,
      optIn
    });
  }

  // 4. Send Patient Called (YOUR TURN)
  async sendPatientCalled({ patientName, mobile, tokenNumber, doctorName, departmentName, roomNumber, patientId, optIn = true }) {
    const text = `🚨 *YOUR TURN NOW - Smart Queue Hospital*\n\nHello ${patientName},\n\nYour token *${tokenNumber}* is now being called!\n\n👨‍⚕️ *Doctor:* ${doctorName}\n🏥 *Department:* ${departmentName}\n🚪 *Room:* ${roomNumber}\n\nPlease proceed directly to the consultation room.\n\nThank you!`;
    return this.sendMessage({
      toMobile: mobile,
      messageText: text,
      templateName: 'hospital_patient_called',
      templateParams: [patientName, tokenNumber, doctorName, departmentName, roomNumber],
      patientId,
      optIn
    });
  }

  // 5. Send Appointment Cancelled
  async sendAppointmentCancelled({ patientName, mobile, tokenNumber, doctorName, patientId, optIn = true }) {
    const text = `⚠️ *Smart Queue Hospital*\n\nHello ${patientName},\n\nYour appointment with ${doctorName} (Token: ${tokenNumber}) has been cancelled.\nIf this was unintentional, please re-book through the portal.`;
    return this.sendMessage({
      toMobile: mobile,
      messageText: text,
      templateName: 'hospital_appointment_cancelled',
      templateParams: [patientName, tokenNumber, doctorName],
      patientId,
      optIn
    });
  }
}

module.exports = new WhatsAppService();
