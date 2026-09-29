import React, { useState, useEffect, useCallback } from 'react';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  FastForward, 
  UserX, 
  Sparkles, 
  AlertTriangle, 
  Activity,
  Phone,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Volume2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PriorityBadge from '../components/PriorityBadge';

const DoctorDashboard = () => {
  const { user, doctor } = useAuth();
  const { lastQueueUpdate, playAnnouncementAudio } = useSocket();

  const [doctorQueue, setDoctorQueue] = useState({
    currentPatient: null,
    waiting: [],
    completed: [],
    skipped: [],
    noShow: [],
    totalWaiting: 0,
    totalCompleted: 0
  });
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctor?.id || 'doc11111-1111-1111-1111-111111111111');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [consultationTimer, setConsultationTimer] = useState(0);

  // Active consultation timer
  useEffect(() => {
    let interval = null;
    if (doctorQueue.currentPatient) {
      interval = setInterval(() => {
        setConsultationTimer(prev => prev + 1);
      }, 1000);
    } else {
      setConsultationTimer(0);
    }
    return () => clearInterval(interval);
  }, [doctorQueue.currentPatient]);

  const fetchDoctorQueue = useCallback(async () => {
    if (!selectedDoctorId) return;
    try {
      const res = await api.get(`/queue/doctor/${selectedDoctorId}`);
      if (res.data?.success) {
        setDoctorQueue(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      if (res.data?.success) {
        setDoctorsList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchDoctorQueue();
  }, [fetchDoctorQueue]);

  // Real-time queue event listener
  useEffect(() => {
    if (lastQueueUpdate) {
      fetchDoctorQueue();
    }
  }, [lastQueueUpdate, fetchDoctorQueue]);

  // Doctor Action Handlers
  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/queue/call-next', { doctorId: selectedDoctorId });
      if (res.data?.success) {
        fetchDoctorQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Call next failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (queueId) => {
    setActionLoading(true);
    try {
      await api.post(`/queue/${queueId}/recall`);
      fetchDoctorQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (queueId) => {
    setActionLoading(true);
    try {
      await api.post(`/queue/${queueId}/complete`);
      fetchDoctorQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (queueId) => {
    setActionLoading(true);
    try {
      await api.post(`/queue/${queueId}/skip`);
      fetchDoctorQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (queueId) => {
    setActionLoading(true);
    try {
      await api.post(`/queue/${queueId}/no-show`);
      fetchDoctorQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeDoctorInfo = doctorsList.find(d => d.id === selectedDoctorId) || {
    name: user?.name || 'Dr. Rajesh Kumar',
    specialization: 'Senior Cardiologist',
    room_number: 'Room 203',
    department_name: 'Cardiology'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Doctor Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl glass-panel shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/25">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{activeDoctorInfo.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Doctor Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeDoctorInfo.specialization} • {activeDoctorInfo.room_number} ({activeDoctorInfo.department_name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Doctor Switcher for demo */}
          {doctorsList.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
            >
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>Switch: {doc.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={fetchDoctorQueue}
            title="Refresh Queue"
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: ACTIVE CONSULTATION & CALL NEXT (Left) vs WAITING QUEUE (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE CONSULTATION & CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Patient Card */}
          {doctorQueue.currentPatient ? (
            <div className="p-6 sm:p-8 rounded-3xl glass-card-glow relative overflow-hidden border border-emerald-500/40 space-y-6">
              
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                  <Activity className="w-3.5 h-3.5" />
                  CURRENT CONSULTATION IN PROGRESS
                </span>
                <PriorityBadge priority={doctorQueue.currentPatient.priority} size="sm" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-mono tracking-widest text-slate-400">PATIENT TOKEN</div>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                    {doctorQueue.currentPatient.token_number}
                  </div>
                  <div className="text-base font-bold text-slate-200 mt-1">
                    {doctorQueue.currentPatient.patient_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Mobile: {doctorQueue.currentPatient.patient_mobile || 'N/A'}
                  </div>
                </div>

                <div className="text-right p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Consultation Timer</div>
                  <div className="text-3xl font-black font-mono text-emerald-400">
                    {formatTimer(consultationTimer)}
                  </div>
                  <div className="text-[10px] text-slate-500">Live Active Clock</div>
                </div>
              </div>

              {/* Patient Reason / Triage Note */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Chief Complaint & Symptoms:</div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {doctorQueue.currentPatient.reason || 'General Consultation & Routine Review'}
                </p>
              </div>

              {/* Consultation Control Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={() => handleRecall(doctorQueue.currentPatient.id)}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recall</span>
                </button>

                <button
                  onClick={() => handleSkip(doctorQueue.currentPatient.id)}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Skip</span>
                </button>

                <button
                  onClick={() => handleNoShow(doctorQueue.currentPatient.id)}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>No Show</span>
                </button>

                <button
                  onClick={() => handleComplete(doctorQueue.currentPatient.id)}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-3xl glass-panel text-center space-y-4 border border-dashed border-slate-700">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Consultation Room Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Ready for the next patient? Click below to summon the highest-priority patient in the queue.
                </p>
              </div>

              <button
                onClick={handleCallNext}
                disabled={actionLoading || doctorQueue.waiting.length === 0}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2 mx-auto disabled:opacity-40 disabled:hover:scale-100"
              >
                <Sparkles className="w-4 h-4" />
                <span>CALL NEXT PATIENT ({doctorQueue.waiting.length} waiting)</span>
              </button>
            </div>
          )}

          {/* Quick Call Next if consultation active */}
          {doctorQueue.currentPatient && (
            <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Next Patient in Waiting:</div>
                <div className="text-xs text-slate-400">
                  {doctorQueue.waiting[0]?.token_number || 'None'} ({doctorQueue.waiting[0]?.patient_name || 'Empty'})
                </div>
              </div>
              <button
                onClick={handleCallNext}
                disabled={actionLoading || doctorQueue.waiting.length === 0}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all disabled:opacity-40"
              >
                Call Next & Complete Current
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PRIORITY WAITING QUEUE (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">Waiting Room Queue</h2>
            </div>
            <span className="text-xs font-mono text-sky-400 font-bold">
              {doctorQueue.waiting.length} Patients
            </span>
          </div>

          <div className="glass-panel rounded-3xl p-3 max-h-[580px] overflow-y-auto space-y-2.5">
            {doctorQueue.waiting.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">No waiting patients</p>
                <p className="text-xs text-slate-600 mt-1">All registered patients have been seen.</p>
              </div>
            ) : (
              doctorQueue.waiting.map((item, idx) => {
                const isEmergency = item.priority === 1;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEmergency
                        ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10'
                        : item.priority === 2
                          ? 'bg-orange-950/30 border-orange-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-white">{item.token_number}</span>
                            <PriorityBadge priority={item.priority} size="sm" showIcon={false} />
                          </div>
                          <div className="text-xs font-semibold text-slate-200 mt-0.5">
                            {item.patient_name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono text-sky-400 font-semibold">
                          ~{item.estimated_wait_time}m
                        </div>
                        <div className="text-[10px] text-slate-500">Est. Wait</div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">{item.reason || 'General Checkup'}</span>
                      <button
                        onClick={() => handleRecall(item.id)}
                        className="text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        Call Patient &rarr;
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default DoctorDashboard;
