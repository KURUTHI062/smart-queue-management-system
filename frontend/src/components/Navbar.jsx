import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Tv, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Bell, 
  LogOut, 
  LogIn, 
  UserPlus,
  ChevronDown,
  Settings,
  Shield,
  Wifi
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationModal from './NotificationModal';
import WhatsAppPreviewModal from './WhatsAppPreviewModal';
import UserProfileModal from './UserProfileModal';

const Navbar = () => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const { connected, soundEnabled, setSoundEnabled, notifications, unreadNotifsCount, setUnreadNotifsCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [whatsAppModalData, setWhatsAppModalData] = useState(null);

  const navLinks = [
    { name: 'Departments', path: '/departments' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Live TV Board', path: '/queue-display', icon: Tv, badge: 'Live TV' },
    ...(isAuthenticated && role === 'PATIENT' ? [{ name: 'My Patient Portal', path: '/patient-dashboard', icon: User }] : []),
    ...(isAuthenticated && role === 'DOCTOR' ? [{ name: 'Doctor Console', path: '/doctor-dashboard', icon: Stethoscope }] : []),
    ...(isAuthenticated && role === 'ADMIN' ? [{ name: 'Admin Operations', path: '/admin-dashboard', icon: ShieldAlert }] : [])
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5 animate-pulse text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg text-white tracking-tight">SmartCare</span>
                    <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">SQMS</span>
                  </div>
                  <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Priority Queue & Triage System</p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5">
              
              {/* WebSocket Status Indicator */}
              <div 
                title={connected ? 'Realtime WebSocket Connected' : 'Reconnecting to Queue WebSocket...'}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700/60"
              >
                {connected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-amber-400 hidden sm:inline">Connecting</span>
                  </>
                )}
              </div>

              {/* Sound Announcement Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Hospital audio voice announcements ON' : 'Audio announcements MUTED'}
                className={`p-2 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'bg-slate-800/80 border-slate-700 text-sky-400 hover:bg-slate-700/80'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:bg-slate-800'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => {
                  setIsNotifOpen(true);
                  setUnreadNotifsCount(0);
                }}
                className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center animate-bounce shadow-md">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Authenticated User Menu or Login/Register Links */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block text-left pr-1">
                      <div className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name}</div>
                      <div className="text-[10px] text-sky-400 uppercase font-bold tracking-wider">{role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-1.5 z-50 animate-fadeIn">
                      <div className="px-3 py-2 border-b border-slate-700/70">
                        <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{user?.mobile}</div>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-slate-700/80 text-slate-200 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-sky-400" />
                        <span>Profile & Password</span>
                      </button>

                      <div className="my-1 border-t border-slate-700/70"></div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5 text-sky-400" />
                    <span>Login</span>
                  </Link>

                  <Link
                    to="/register"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Link>
                </div>
              )}

            </div>

          </div>
        </div>
      </nav>

      {/* Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Notification Drawer */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          notifications.forEach(n => n.is_read = true);
          setUnreadNotifsCount(0);
        }}
        onOpenWhatsApp={(notif) => {
          setIsNotifOpen(false);
          setWhatsAppModalData({
            patientName: user?.name || 'Patient',
            title: notif.title,
            message: notif.message,
            time: new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }}
      />

      {/* WhatsApp Modal */}
      <WhatsAppPreviewModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        notificationData={whatsAppModalData}
      />
    </>
  );
};

export default Navbar;

