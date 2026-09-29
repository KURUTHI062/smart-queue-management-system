import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Tv, 
  UserCheck, 
  Stethoscope, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  HeartPulse,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PriorityBadge from '../components/PriorityBadge';

const Home = () => {
  const { quickDemoLogin } = useAuth();

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Smart Hospital Queue & Triage Management
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Intelligent Queue Management with <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">Strict Priority Triage</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate waiting room congestion. Real-time patient priority sorting (Emergency &gt; High &gt; Normal), live TV display boards, audio voice announcements, and instant WhatsApp alerts.
          </p>

          {/* Quick Access Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <PriorityBadge priority={1} />
            <PriorityBadge priority={2} />
            <PriorityBadge priority={3} />
            <PriorityBadge priority={4} />
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Link
              to="/queue-display"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/30 hover:scale-105 transition-all"
            >
              <Tv className="w-4 h-4" />
              <span>Launch Live TV Queue Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Sign In / Demo Hub</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Role Quick Selector Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Experience All 3 Hospital Roles</h2>
          <p className="text-sm text-slate-400 mt-1">Jump into any perspective with pre-configured live hospital data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Patient Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:border-sky-500/50 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Patient Portal</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Track live token position, estimated wait times, book appointments with auto-triage, and receive simulated WhatsApp alerts.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live token progress ring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Instant WhatsApp notifications
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/patient-dashboard"
                className="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white font-semibold text-xs border border-sky-500/40 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Enter Patient Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Doctor Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Doctor Consultation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage prioritized queues, trigger "Call Next Patient" broadcast with automated TV chimes, recall, or complete visits.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Emergency cases automatically bumped to #1
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live consultation timer & controls
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/doctor-dashboard"
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white font-semibold text-xs border border-emerald-500/40 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Enter Doctor Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:border-rose-500/50 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hospital Admin</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hospital analytics, live queue throughput, priority algorithm weights, doctor rosters, and WhatsApp audit logs.
                </p>
              </div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live analytics & wait-time KPIs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Doctor account creation & roster
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/admin-dashboard"
                className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs border border-rose-500/40 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Enter Admin Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white">Why SmartCare SQMS?</h3>
            <p className="text-sm text-slate-400 mt-1">Built to handle high patient density with zero chaos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">1</div>
              <h4 className="font-bold text-sm text-white">Emergency Auto-Bumping</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Critical trauma and chest pain cases automatically jump ahead of routine checkups without human delay.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">2</div>
              <h4 className="font-bold text-sm text-white">Voice & TV Announcements</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic Web Speech voice audio calls ("Token C-001 to Room 203") when a doctor taps Call Next.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">3</div>
              <h4 className="font-bold text-sm text-white">WhatsApp Notifications</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Patients receive confirmation, token generation, 1-patient ahead alerts, and immediate call alerts on their phone.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
