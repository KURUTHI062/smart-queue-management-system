/**
 * Application Constants
 */
const ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN'
};

const PRIORITY = {
  EMERGENCY: 1,
  HIGH: 2,
  MEDIUM: 3,
  NORMAL: 4
};

const PRIORITY_LABELS = {
  1: { label: 'Emergency', color: 'red', badge: 'bg-red-100 text-red-800 border-red-300' },
  2: { label: 'High', color: 'orange', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
  3: { label: 'Medium', color: 'amber', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  4: { label: 'Normal', color: 'blue', badge: 'bg-blue-100 text-blue-800 border-blue-300' }
};

const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED'
};

const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
};

const NOTIFICATION_TYPES = {
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  TOKEN_GENERATED: 'TOKEN_GENERATED',
  QUEUE_UPDATED: 'QUEUE_UPDATED',
  TOKEN_APPROACHING: 'TOKEN_APPROACHING',
  YOUR_TURN: 'YOUR_TURN',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED'
};

module.exports = {
  ROLES,
  PRIORITY,
  PRIORITY_LABELS,
  QUEUE_STATUS,
  APPOINTMENT_STATUS,
  NOTIFICATION_TYPES
};
