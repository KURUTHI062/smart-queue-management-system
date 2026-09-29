import React from 'react';
import { ShieldCheck, HeartPulse, Clock, Sparkles, Award, Users, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          About SmartCare SQMS
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Pioneering Smart Healthcare with Real-time Triage
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          SmartCare Hospital Queue Management System (SQMS) bridges the gap between arrival and consultation through intelligent emergency escalation, real-time WebSockets, and seamless patient communication.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Clinical Priority Triage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Emergency (P1) and high-priority trauma cases automatically bypass routine checkup lines, ensuring immediate medical attention without manual administrative delays.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Dynamic Wait Times</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dynamic algorithms calculate realistic estimated wait times based on historical consultation durations and real-time doctor availability.
          </p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Targeted Privacy Control</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secure WebSocket channel isolation ensures patient medical summons and private notices are only delivered to the specific intended recipient.
          </p>
        </div>
      </div>

      {/* Hospital Metrics & Standards */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel space-y-6">
        <h3 className="text-xl font-bold text-white text-center">Quality & Clinical Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-3xl font-black font-mono text-sky-400">99.9%</div>
            <div className="text-xs text-slate-400 mt-1">Uptime Reliability</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-3xl font-black font-mono text-emerald-400">&lt; 3s</div>
            <div className="text-xs text-slate-400 mt-1">Realtime Call Latency</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-3xl font-black font-mono text-amber-400">4-Tier</div>
            <div className="text-xs text-slate-400 mt-1">Triage Protocol</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-3xl font-black font-mono text-teal-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">HIPAA-Compliant Displays</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-4 pt-4">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 transition-all"
        >
          <span>Get Started & Book an Appointment</span>
        </Link>
      </div>
    </div>
  );
};

export default About;
