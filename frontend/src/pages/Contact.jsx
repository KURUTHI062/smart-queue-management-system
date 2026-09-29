import React, { useState } from 'react';
import { Phone, Mail, MapPin, AlertCircle, CheckCircle2, Send, Clock, ShieldAlert } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Emergency & Hospital Contact</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Need immediate medical support or assistance with your queue token? Reach our triage coordinators 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Information & Emergency Banner (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Emergency Alert Card */}
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/50 text-red-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <span>Medical Emergency Hotline</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If you or a patient is experiencing acute chest pain, trauma, or breathing distress, dial the direct emergency line immediately.
            </p>
            <div className="text-2xl font-black font-mono text-white">
              📞 +91 98765 00108 / 108
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-4">
            <h3 className="text-base font-bold text-white">Hospital Information</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>SmartCare Hospital Central Campus, 42 Health Boulevard, Tech Zone, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 98765 00001 (General OPD Enquiries)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>support@smartcare.hospital.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                <span>OPD Timings: Mon – Sat (08:00 AM – 08:00 PM)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl glass-panel space-y-6">
          <h3 className="text-lg font-bold text-white">Send an Inquiry or Feedback</h3>

          {submitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Thank you for reaching out. Our support staff will respond shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Rahul Verma"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                    placeholder="name@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                  placeholder="Token inquiry / Appointment assistance"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Message</label>
                <textarea
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                  placeholder="Describe your question or feedback..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-md shadow-sky-500/25 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
