import React, { useState, useEffect } from 'react';
import { Stethoscope, Clock, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        if (res.data?.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Our Medical Specialists</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Consult with board-certified physicians, surgeons, and department heads using our live priority scheduling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div key={doc.id} className="p-6 rounded-3xl glass-card space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
                  {doc.name.charAt(0)}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  doc.availability_status === 'AVAILABLE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {doc.availability_status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{doc.name}</h3>
                <p className="text-xs text-sky-400 font-medium">{doc.specialization}</p>
                <p className="text-xs text-slate-400 mt-1">{doc.department_name}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{doc.room_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>~{doc.avg_consultation_time} mins avg visit</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <Link
                to="/patient/book-appointment"
                className="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white font-semibold text-xs border border-sky-500/40 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>Book with {doc.name.split(' ')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
