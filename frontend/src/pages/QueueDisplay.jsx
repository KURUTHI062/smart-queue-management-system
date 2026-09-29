import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tv, 
  Clock, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Filter, 
  Activity, 
  Sparkles, 
  ArrowRight,
  Stethoscope,
  MapPin,
  RefreshCw,
  BellRing
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import PriorityBadge from '../components/PriorityBadge';

const QueueDisplay = () => {
  const { lastQueueUpdate, latestAnnouncement, soundEnabled, setSoundEnabled, playAnnouncementAudio } = useSocket();
  const [queueData, setQueueData] = useState({ nowServing: [], waiting: [], totalWaiting: 0 });
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [flashCardId, setFlashCardId] = useState(null);

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const params = selectedDept ? { departmentId: selectedDept } : {};
      const res = await api.get('/queue', { params });
      if (res.data?.success) {
        setQueueData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time update listener from Socket.io
  useEffect(() => {
    if (lastQueueUpdate) {
      fetchQueue();
    }
  }, [lastQueueUpdate, fetchQueue]);

  // Visual Flash when patient called
  useEffect(() => {
    if (latestAnnouncement) {
      setFlashCardId(latestAnnouncement.queueId || 'active');
      const timer = setTimeout(() => setFlashCardId(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [latestAnnouncement]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6">
      
      {/* Top TV Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">SMARTCARE QUEUE BOARD</h1>
              <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                LIVE TV
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">PRIORITY-OPTIMIZED PATIENT DISPATCH</p>
          </div>
        </div>

        {/* Center Department Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-xl">
          <button
            onClick={() => setSelectedDept('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
              selectedDept === ''
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                selectedDept === dept.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Right TV Controls & Live Clock */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xl font-mono font-bold text-sky-400">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Voice announcements enabled' : 'Voice announcements muted'}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullScreen}
              title="Toggle Full Screen TV Display"
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            >
              <Maximize className="w-5 h-5" />
            </button>

            <button
              onClick={fetchQueue}
              title="Refresh Queue"
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Grid: NOW CALLING (Left / Prominent) vs UPCOMING WAITING (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        
        {/* NOW CALLING SECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-xl font-extrabold tracking-wider text-emerald-400 uppercase">
                NOW CALLING / SERVING
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {queueData.nowServing.length} Active Consultation(s)
            </span>
          </div>

          {queueData.nowServing.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Activity className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-300">Doctors Preparing Next Consultations</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Patients will be summoned automatically based on triage priority. Please observe this screen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {queueData.nowServing.map((item) => {
                const isFlashing = flashCardId === item.id || flashCardId === 'active';
                const isEmergency = item.priority === 1;

                return (
                  <div
                    key={item.id}
                    className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                      isFlashing
                        ? 'animate-call-flash bg-slate-900 border-sky-400'
                        : isEmergency
                          ? 'glass-card-emergency'
                          : 'glass-card-glow'
                    }`}
                  >
                    {/* Top status & Priority */}
                    <div className="flex items-center justify-between mb-4">
                      <PriorityBadge priority={item.priority} size="sm" />
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.status}
                      </span>
                    </div>

                    {/* Enormous Token Number */}
                    <div className="text-center py-4">
                      <div className="text-xs uppercase font-mono tracking-widest text-slate-400">TOKEN NUMBER</div>
                      <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                        {item.token_number}
                      </div>
                    </div>

                    {/* Room & Doctor Info */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <MapPin className="w-4 h-4 text-sky-400" />
                          Proceed To:
                        </span>
                        <span className="font-extrabold text-sm text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
                          {item.room_number || 'Room 101'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                          Consultant:
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.doctor_name || 'Dr. Specialist'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 text-center pt-1 font-mono">
                        {item.department_name}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UPCOMING WAITING SECTION (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="text-xl font-extrabold tracking-wider text-white uppercase">
                UPCOMING IN QUEUE
              </h2>
            </div>
            <span className="text-xs font-mono text-sky-400 font-bold">
              {queueData.waiting.length} Waiting
            </span>
          </div>

          <div className="glass-panel rounded-3xl p-3 max-h-[580px] overflow-y-auto space-y-2.5">
            {queueData.waiting.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">Queue is currently clear</p>
                <p className="text-xs text-slate-600 mt-1">New tokens will appear here automatically.</p>
              </div>
            ) : (
              queueData.waiting.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    item.priority === 1
                      ? 'bg-red-950/40 border-red-500/50 shadow-md shadow-red-500/10'
                      : item.priority === 2
                        ? 'bg-orange-950/30 border-orange-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-300">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-white">{item.token_number}</span>
                        <PriorityBadge priority={item.priority} size="sm" showIcon={false} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {item.department_name} • {item.doctor_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono text-sky-400 font-semibold">
                      ~{item.estimated_wait_time} min
                    </div>
                    <div className="text-[10px] text-slate-500">Est. Wait</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Announcement Ticker */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-sky-400">
          <BellRing className="w-4 h-4 text-sky-400 animate-bounce" />
          <span>HOSPITAL NOTICE:</span>
        </div>
        <div className="flex-1 px-4 overflow-hidden whitespace-nowrap text-slate-300">
          <span className="inline-block animate-marquee">
            🚨 Emergency cases receive immediate high-priority triage • Please have your token and ID ready when your token is called • Live WhatsApp updates are active on registered numbers.
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          POWERED BY SMARTCARE SQMS
        </div>
      </div>

    </div>
  );
};

export default QueueDisplay;
