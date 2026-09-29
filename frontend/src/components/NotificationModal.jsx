import React from 'react';
import { X, Bell, CheckCheck, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import api from '../services/api';

const NotificationModal = ({ isOpen, onClose, notifications = [], onMarkAllRead, onOpenWhatsApp }) => {
  if (!isOpen) return null;

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/all/read');
      if (onMarkAllRead) onMarkAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Live Alerts & Queue Activity</h3>
              <p className="text-xs text-slate-400">{notifications.length} total notifications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Targeted patient stream</span>
          <button 
            onClick={handleMarkAll}
            className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-slate-600 mt-1">Real-time alerts will appear here when tokens are updated.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isTurn = n.type === 'YOUR_TURN';
              const isApproaching = n.type === 'TOKEN_APPROACHING';

              return (
                <div 
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isTurn 
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10 animate-pulse'
                      : isApproaching
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : !n.is_read
                          ? 'bg-slate-800/80 border-sky-500/40'
                          : 'bg-slate-800/30 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isTurn ? (
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                        </span>
                      ) : isApproaching ? (
                        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                          <Clock className="w-4 h-4" />
                        </span>
                      )}
                      <h4 className="font-semibold text-sm text-slate-200">{n.title}</h4>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1.5"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{n.message}</p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
                    <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {onOpenWhatsApp && (
                      <button 
                        onClick={() => onOpenWhatsApp(n)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                      >
                        View WhatsApp Message &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationModal;
