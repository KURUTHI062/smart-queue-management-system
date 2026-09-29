import React from 'react';
import { X, MessageSquare, CheckCheck, Clock, ShieldCheck, Hospital } from 'lucide-react';

const WhatsAppPreviewModal = ({ isOpen, onClose, notificationData }) => {
  if (!isOpen || !notificationData) return null;

  const {
    recipient = '+91 98112 23344',
    patientName = 'Rahul Verma',
    tokenNumber = 'C-004',
    doctorName = 'Dr. Rajesh Kumar',
    departmentName = 'Cardiology',
    roomNumber = 'Room 203',
    queuePosition = '4',
    estimatedWait = '45',
    title = 'Hospital Alert',
    message = '',
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } = notificationData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-[#0b141a]">
        
        {/* Phone Top Notch / WhatsApp Header */}
        <div className="bg-[#1f2c34] px-4 py-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
              <Hospital className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">SmartCare Hospital</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full border border-emerald-500/30">Verified</span>
              </div>
              <p className="text-xs text-emerald-400 font-mono">Official Queue Bot</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-700/50 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Chat Body */}
        <div className="p-4 min-h-[340px] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b141a] flex flex-col justify-end space-y-3">
          
          <div className="text-center">
            <span className="text-[11px] bg-[#182229] text-slate-400 px-3 py-1 rounded-lg border border-slate-800">
              TODAY • ENCRYPTED LIVE DISPATCH
            </span>
          </div>

          {/* Incoming Message Bubble */}
          <div className="self-start max-w-[90%] bg-[#1f2c34] text-slate-100 rounded-2xl rounded-tl-sm p-3.5 shadow-lg border border-slate-700/40 text-sm relative">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SmartCare Queue Alert</span>
            </div>

            <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {message || (
                <>
                  🏥 <strong>SmartCare Hospital Notification</strong><br /><br />
                  Hello <strong>{patientName}</strong>,<br /><br />
                  🎫 <strong>Token:</strong> {tokenNumber}<br />
                  👨‍⚕️ <strong>Doctor:</strong> {doctorName} ({departmentName})<br />
                  🚪 <strong>Location:</strong> {roomNumber}<br />
                  📊 <strong>Queue Position:</strong> #{queuePosition}<br />
                  ⏳ <strong>Estimated Wait:</strong> ~{estimatedWait} mins<br /><br />
                  We will notify you immediately when you are called!
                </>
              )}
            </p>

            <div className="mt-2.5 flex items-center justify-end gap-1 text-[10px] text-slate-400">
              <span>{time}</span>
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Quick Action Simulated Pills */}
          <div className="flex gap-2 pt-2">
            <div className="bg-[#1f2c34] text-emerald-400 text-xs py-1.5 px-3 rounded-xl border border-slate-700/60 font-medium flex-1 text-center">
              📍 Track Live TV
            </div>
            <div className="bg-[#1f2c34] text-emerald-400 text-xs py-1.5 px-3 rounded-xl border border-slate-700/60 font-medium flex-1 text-center">
              📞 Help Desk
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#111b21] p-3 text-center border-t border-slate-800">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Dispatched via WhatsApp Cloud API & WebSockets
          </p>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppPreviewModal;
