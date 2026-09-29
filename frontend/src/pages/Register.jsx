import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    emergencyContact: '',
    whatsappOptIn: true
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = formData.mobile.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Please select your date of birth.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please enter your residential address.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        whatsappOptIn: formData.whatsappOptIn
      });

      navigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mx-auto">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Patient Account</h2>
            <p className="text-xs text-slate-400">Join SmartCare for real-time queue tracking and instant token updates</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min 6 chars) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border text-sm text-white placeholder-slate-500 focus:outline-none ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-700 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  required
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, city, state, postal code"
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Number (Optional)</label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="Relative / Guardian mobile"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* WhatsApp Opt In Checkbox */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="whatsappOptIn"
                name="whatsappOptIn"
                checked={formData.whatsappOptIn}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-400 cursor-pointer"
              />
              <label htmlFor="whatsappOptIn" className="text-xs text-slate-200 cursor-pointer">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Enable WhatsApp Live Queue Alerts
                </span>
                Receive live token updates, wait time estimates, and doctor room call alerts straight to your phone.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Creating Your Account...' : 'Complete Registration & Enter Portal'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1">
                <span>Sign in with your credentials</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;

