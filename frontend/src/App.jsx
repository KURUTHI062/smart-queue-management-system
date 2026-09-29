import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Departments from './pages/Departments';
import Doctors from './pages/Doctors';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import QueueDisplay from './pages/QueueDisplay';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying SmartCare Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If patient tries to open admin, redirect to patient dashboard, etc.
    if (user?.role === 'PATIENT') return <Navigate to="/patient-dashboard" replace />;
    if (user?.role === 'DOCTOR') return <Navigate to="/doctor-dashboard" replace />;
    if (user?.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
};

const App = () => {
  const location = useLocation();
  // Hide standard navbar on TV board if desired, or keep it clean
  const isQueueDisplay = location.pathname === '/queue-display';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {!isQueueDisplay && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/queue-display" element={<QueueDisplay />} />

          {/* Patient Portal Routes */}
          {['/patient-dashboard', '/patient/dashboard', '/patient/queue', '/patient/book-appointment', '/patient/appointments', '/patient/notifications', '/patient/profile'].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Doctor Console Routes */}
          {['/doctor-dashboard', '/doctor/dashboard', '/doctor/queue', '/doctor/appointments', '/doctor/current-patient', '/doctor/profile'].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Hospital Admin Hub Routes */}
          {['/admin-dashboard', '/admin/dashboard', '/admin/patients', '/admin/doctors', '/admin/departments', '/admin/appointments', '/admin/queue', '/admin/priority', '/admin/reports', '/admin/settings'].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isQueueDisplay && (
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              SmartCare Hospital Queue Management System (SQMS) • Strict Priority Engine
            </div>
            <div className="flex items-center gap-4">
              <span>Emergency (P1) Priority Triage</span>
              <span>•</span>
              <span>WhatsApp Cloud API Sync</span>
              <span>•</span>
              <span>Realtime WebSockets</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
