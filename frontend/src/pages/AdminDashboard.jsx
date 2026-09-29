import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  MessageSquare, 
  Activity, 
  Stethoscope, 
  RefreshCw,
  TrendingUp,
  Save
} from 'lucide-react';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    waitingPatients: 0,
    doctorsAvailable: 0,
    completedConsultations: 0,
    emergencyCases: 0
  });

  const [reports, setReports] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState([]);
  
  // Doctor Creation State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    department_id: '',
    specialization: '',
    room_number: '',
    avg_consultation_time: 15
  });
  const [addDoctorLoading, setAddDoctorLoading] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState('');
  const [addDoctorSuccess, setAddDoctorSuccess] = useState('');

  // Priority Config Form
  const [config, setConfig] = useState({
    emergencyWeight: 1,
    highWeight: 2,
    mediumWeight: 3,
    normalWeight: 4,
    avgConsultationMinutes: 15
  });
  const [configSuccess, setConfigSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      const [statsRes, repRes, patRes, docRes, logsRes, deptRes] = await Promise.all([
        api.get('/admin/statistics'),
        api.get('/admin/reports'),
        api.get('/admin/patients'),
        api.get('/doctors'),
        api.get('/admin/notification-logs'),
        api.get('/departments')
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (repRes.data?.success) setReports(repRes.data.data);
      if (patRes.data?.success) setPatients(patRes.data.data);
      if (docRes.data?.success) setDoctors(docRes.data.data);
      if (logsRes.data?.success) setNotificationLogs(logsRes.data.data);
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0 && !doctorForm.department_id) {
          setDoctorForm(prev => ({ ...prev, department_id: deptRes.data.data[0].id }));
        }
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    setAddDoctorError('');
    setAddDoctorSuccess('');

    if (!doctorForm.name.trim() || !doctorForm.email.trim() || !doctorForm.password || !doctorForm.department_id || !doctorForm.room_number) {
      setAddDoctorError('Please complete all required doctor fields.');
      return;
    }

    if (doctorForm.password.length < 6) {
      setAddDoctorError('Doctor password must be at least 6 characters long.');
      return;
    }

    setAddDoctorLoading(true);

    try {
      const res = await api.post('/doctors', doctorForm);
      if (res.data?.success) {
        setAddDoctorSuccess(`Doctor ${doctorForm.name} created successfully! They can now log in.`);
        setDoctorForm({
          name: '',
          email: '',
          mobile: '',
          password: '',
          department_id: departments[0]?.id || '',
          specialization: '',
          room_number: '',
          avg_consultation_time: 15
        });
        await fetchAdminData();
        setTimeout(() => {
          setShowAddDoctorModal(false);
          setAddDoctorSuccess('');
        }, 2000);
      }
    } catch (err) {
      setAddDoctorError(err.response?.data?.message || err.message || 'Failed to create doctor account.');
    } finally {
      setAddDoctorLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/priority-config', config);
      if (res.data?.success) {
        setConfigSuccess('Priority weights updated successfully');
        setTimeout(() => setConfigSuccess(''), 3000);
      }
    } catch (err) {
      alert('Config update failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl glass-panel shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-500/25">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Hospital Operations & Triage Hub</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                Hospital Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Patient Throughput, Priority Algorithm & Realtime WhatsApp Audit Stream
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          title="Refresh All Operations Data"
          className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Patients</div>
          <div className="text-3xl font-black font-mono text-white">{stats.totalPatients}</div>
          <div className="text-[10px] text-slate-500">Registered Roster</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Today's Visits</div>
          <div className="text-3xl font-black font-mono text-sky-400">{stats.todayAppointments}</div>
          <div className="text-[10px] text-slate-500">Total Scheduled</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Waiting Queue</div>
          <div className="text-3xl font-black font-mono text-amber-400">{stats.waitingPatients}</div>
          <div className="text-[10px] text-slate-500">Active in Lobby</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Available Doctors</div>
          <div className="text-3xl font-black font-mono text-emerald-400">{stats.doctorsAvailable}</div>
          <div className="text-[10px] text-slate-500">In Consultations</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Completed</div>
          <div className="text-3xl font-black font-mono text-teal-400">{stats.completedConsultations}</div>
          <div className="text-[10px] text-slate-500">Consultations Done</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-red-500/40 bg-red-950/20 space-y-1">
          <div className="text-[11px] font-mono text-red-400 uppercase font-bold">Emergency Cases</div>
          <div className="text-3xl font-black font-mono text-red-400 animate-pulse">{stats.emergencyCases}</div>
          <div className="text-[10px] text-red-300">P1 Immediate</div>
        </div>

      </div>

      {/* 2-Column: Priority Configurator (Left) & Department Load / Reports (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PRIORITY WEIGHT CONFIGURATION (5 COLS) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Queue Engine Parameters</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Customize the triage weighting tiers and estimated consultation velocity.
          </p>

          {configSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{configSuccess}</span>
            </div>
          )}

          <form onSubmit={handleConfigSubmit} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Emergency (P1) Priority Order:</span>
                <span className="font-mono text-red-400 font-bold">Priority #1 (Top)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">High Priority (P2) Order:</span>
                <span className="font-mono text-orange-400 font-bold">Priority #2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Medium Priority (P3) Order:</span>
                <span className="font-mono text-amber-400 font-bold">Priority #3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Normal (P4) Order:</span>
                <span className="font-mono text-sky-400 font-bold">Priority #4</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <label className="block font-semibold text-slate-300 mb-1">
                Average Consultation Duration (Minutes per patient)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={config.avgConsultationMinutes}
                onChange={(e) => setConfig(prev => ({ ...prev, avgConsultationMinutes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used to compute accurate live estimated wait times across all TV screens & WhatsApp messages.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Queue Configuration</span>
            </button>
          </form>
        </div>

        {/* DEPARTMENT BREAKDOWN (7 COLS) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Department Queue Loads</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Department Metrics</span>
          </div>

          <div className="space-y-3">
            {reports?.departmentBreakdown?.map((dept) => (
              <div key={dept.id} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{dept.name}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {dept.totalAppointments} Total Appointments Today
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-400">{dept.waiting}</div>
                    <div className="text-[10px] text-slate-400">Waiting</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{dept.completed}</div>
                    <div className="text-[10px] text-slate-400">Completed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* NOTIFICATION & WHATSAPP AUDIT LOGS */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">WhatsApp & SMS Live Dispatch Audit Logs</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {notificationLogs.length} Dispatches Recorded
          </span>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {notificationLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Dispatched WhatsApp messages will stream here live as patients book and doctors call.
            </div>
          ) : (
            notificationLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {log.channel}
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">{log.recipient}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] truncate max-w-xl">
                    {log.payload?.messageText || log.payload?.templateName || 'Notification payload dispatched'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-semibold">
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DOCTOR DIRECTORY */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Medical Staff & Consultation Rooms</h2>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/25 transition-all"
              >
                <span>+ Register New Doctor</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">{doctors.length} Doctors</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{doc.name}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${doc.availability_status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </div>
              <p className="text-xs text-slate-300">{doc.specialization}</p>
              <div className="text-[11px] text-slate-400 font-mono truncate">{doc.email}</div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-sky-400">{doc.room_number}</span>
                <span>{doc.department_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register New Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-lg space-y-5 shadow-2xl relative animate-fadeIn">
            
            <button
              onClick={() => setShowAddDoctorModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Register New Medical Doctor</h3>
                <p className="text-xs text-slate-400">Create an authenticated doctor profile and assign department room</p>
              </div>
            </div>

            {addDoctorError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addDoctorError}</span>
              </div>
            )}

            {addDoctorSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{addDoctorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctorSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    placeholder="e.g. Dr. Alok Nath"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={doctorForm.mobile}
                    onChange={(e) => setDoctorForm({ ...doctorForm, mobile: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Email *</label>
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="doctor@hospital.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Doctor Password *</label>
                  <input
                    type="password"
                    required
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    placeholder="min 6 chars"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                  <select
                    value={doctorForm.department_id}
                    onChange={(e) => setDoctorForm({ ...doctorForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.room_number}
                    onChange={(e) => setDoctorForm({ ...doctorForm, room_number: e.target.value })}
                    placeholder="e.g. Room 205"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="e.g. Senior Cardiologist"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Avg Consultation Time (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={doctorForm.avg_consultation_time}
                    onChange={(e) => setDoctorForm({ ...doctorForm, avg_consultation_time: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={addDoctorLoading}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{addDoctorLoading ? 'Creating Doctor Account...' : 'Register Doctor & Issue Credentials'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
