import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Ticket, 
  Clock, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Stethoscope, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Ban
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PriorityBadge from '../components/PriorityBadge';
import WhatsAppPreviewModal from '../components/WhatsAppPreviewModal';

const PatientDashboard = () => {
  const { user, patient } = useAuth();
  const { lastQueueUpdate, latestAnnouncement } = useSocket();

  const [activeTicket, setActiveTicket] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [whatsAppModalData, setWhatsAppModalData] = useState(null);

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    departmentId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:30 AM',
    reason: '',
    priority: 4
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookSuccessMsg, setBookSuccessMsg] = useState('');

  const fetchPatientData = useCallback(async () => {
    try {
      const [ticketRes, aptsRes, docRes, deptRes] = await Promise.all([
        api.get('/queue/my'),
        api.get('/appointments/my'),
        api.get('/doctors'),
        api.get('/departments')
      ]);

      if (ticketRes.data?.success && ticketRes.data.hasActiveQueue) {
        setActiveTicket(ticketRes.data.data);
      } else {
        setActiveTicket(null);
      }

      if (aptsRes.data?.success) setAppointments(aptsRes.data.data);
      if (docRes.data?.success) setDoctors(docRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);

    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  // Listen to live queue updates
  useEffect(() => {
    if (lastQueueUpdate) {
      fetchPatientData();
    }
  }, [lastQueueUpdate, fetchPatientData]);

  // Fire confetti on Your Turn announcement
  useEffect(() => {
    if (latestAnnouncement && activeTicket && latestAnnouncement.tokenNumber === activeTicket.tokenNumber) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [latestAnnouncement, activeTicket]);

  const handleDepartmentChange = (deptId) => {
    setBookingData(prev => ({
      ...prev,
      departmentId: deptId,
      doctorId: '' // reset doctor
    }));
  };

  const handleReasonChange = (e) => {
    const text = e.target.value;
    let detectedPriority = 4;
    const lower = text.toLowerCase();

    if (lower.includes('chest pain') || lower.includes('breathing') || lower.includes('heart') || lower.includes('severe trauma')) {
      detectedPriority = 1; // Emergency
    } else if (lower.includes('bleeding') || lower.includes('fracture') || lower.includes('fever infant')) {
      detectedPriority = 2; // High
    }

    setBookingData(prev => ({
      ...prev,
      reason: text,
      priority: detectedPriority
    }));
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookSuccessMsg('');

    try {
      const res = await api.post('/appointments', bookingData);
      if (res.data?.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setBookSuccessMsg('Appointment confirmed and Token issued!');
        setTimeout(() => {
          setIsBookModalOpen(false);
          setBookSuccessMsg('');
          fetchPatientData();
        }, 1500);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to book appointment');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment and release your token?')) return;
    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      fetchPatientData();
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    }
  };

  const filteredDoctors = bookingData.departmentId 
    ? doctors.filter(d => d.department_id === bookingData.departmentId)
    : doctors;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl glass-panel shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/25">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.name || 'Patient'}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">
                Patient Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mobile: {user?.mobile || '+91 98112 23344'} • Live Queue Sync Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPatientData}
            title="Refresh Live Token Status"
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Doctor / Get Token</span>
          </button>
        </div>
      </div>

      {/* ACTIVE TOKEN HERO CARD */}
      {activeTicket ? (
        <div className="p-6 sm:p-8 rounded-3xl glass-card-glow relative overflow-hidden border border-sky-500/40">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Token Display (5 Cols) */}
            <div className="lg:col-span-5 text-center sm:text-left space-y-4">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                  ACTIVE QUEUE TOKEN
                </span>
                <PriorityBadge priority={activeTicket.priority} size="sm" />
              </div>

              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-slate-400">YOUR TOKEN</div>
                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                  {activeTicket.tokenNumber}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{activeTicket.doctorName}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>{activeTicket.roomNumber} ({activeTicket.departmentName})</span>
                </div>
              </div>

              {/* WhatsApp Simulated Action */}
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => setWhatsAppModalData({
                    patientName: user?.name,
                    tokenNumber: activeTicket.tokenNumber,
                    doctorName: activeTicket.doctorName,
                    departmentName: activeTicket.departmentName,
                    roomNumber: activeTicket.roomNumber,
                    queuePosition: activeTicket.queuePosition,
                    estimatedWait: activeTicket.estimatedWaitTime,
                  })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>View Simulated WhatsApp Notification</span>
                </button>
              </div>
            </div>

            {/* Right Live Position Ring & Metrics (7 Cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Position Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Queue Position</div>
                <div className="text-3xl font-black font-mono text-sky-400">
                  #{activeTicket.queuePosition}
                </div>
                <div className="text-xs text-slate-400">
                  {activeTicket.patientsAhead === 0 ? 'You are Next!' : `${activeTicket.patientsAhead} patient(s) ahead`}
                </div>
              </div>

              {/* Estimated Wait Time */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Estimated Wait</div>
                <div className="text-3xl font-black font-mono text-amber-400">
                  ~{activeTicket.estimatedWaitTime}m
                </div>
                <div className="text-xs text-slate-400">Auto-adjusted live</div>
              </div>

              {/* Current Serving */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Doctor Now Serving</div>
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {activeTicket.currentServingToken}
                </div>
                <div className="text-xs text-slate-400">At {activeTicket.roomNumber}</div>
              </div>

            </div>

          </div>

          {activeTicket.status === 'CALLED' && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>YOUR TURN! Please proceed immediately to {activeTicket.roomNumber}.</span>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-8 rounded-3xl glass-card text-center space-y-4 border border-dashed border-slate-700">
          <Ticket className="w-12 h-12 mx-auto text-slate-600" />
          <div>
            <h3 className="text-lg font-bold text-slate-200">No Active Queue Token Today</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Book a doctor consultation below to receive your priority token and live wait-time tracker.
            </p>
          </div>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all"
          >
            Book Appointment & Generate Token
          </button>
        </div>
      )}

      {/* APPOINTMENTS HISTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span>My Appointments & Tokens</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">{appointments.length} Total</span>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-700/60">
                <tr>
                  <th className="p-4">Token</th>
                  <th className="p-4">Doctor & Dept</th>
                  <th className="p-4">Date & Slot</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Queue Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No appointment records found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-sm text-white">
                        {apt.token_number || 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{apt.doctor_name || 'Dr. Specialist'}</div>
                        <div className="text-[11px] text-slate-400">{apt.department_name} • {apt.room_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{apt.appointment_date}</div>
                        <div className="text-[11px] text-slate-400">{apt.appointment_time}</div>
                      </td>
                      <td className="p-4">
                        <PriorityBadge priority={apt.priority} size="sm" />
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          apt.status === 'CONFIRMED' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                          apt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {apt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-700">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Book Doctor Consultation</h3>
                  <p className="text-xs text-slate-400">Generates instant department queue token</p>
                </div>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bookSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Department</label>
                <select
                  required
                  value={bookingData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Doctor</label>
                <select
                  required
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData(prev => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.specialization} ({doc.room_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingData.appointmentDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Time Slot</label>
                  <select
                    value={bookingData.appointmentTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Symptoms / Reason with auto triage detection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows="2"
                  value={bookingData.reason}
                  onChange={handleReasonChange}
                  placeholder="e.g. Severe chest pain, routine review, fever, joint pain..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                ></textarea>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Type keywords like <span className="text-red-400 font-semibold">'chest pain'</span> or <span className="text-orange-400 font-semibold">'severe bleeding'</span> to trigger automatic priority escalation.
                </p>
              </div>

              {/* Priority Level Preview */}
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-300">Triage Assignment:</span>
                <PriorityBadge priority={bookingData.priority} size="sm" />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{bookingSubmitting ? 'Issuing Token...' : 'Confirm Appointment & Issue Token'}</span>
              </button>

            </form>

          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppPreviewModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        notificationData={whatsAppModalData}
      />

    </div>
  );
};

export default PatientDashboard;
