import React, { useState, useEffect } from 'react';
import { Stethoscope, Activity, Heart, Eye, Brain, Bone, Baby, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const deptIcons = {
  CARD: Heart,
  GEN: Activity,
  PED: Baby,
  ORTHO: Bone,
  DERM: Eye,
  ENT: Stethoscope,
  NEURO: Brain
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) {
          setDepartments(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDept();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Medical Departments & Specialties</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Explore specialized clinics with dedicated priority queues and experienced consultant doctors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const IconComponent = deptIcons[dept.code] || Stethoscope;

          return (
            <div key={dept.id} className="p-6 rounded-3xl glass-card hover:border-sky-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{dept.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold">
                      Prefix: {dept.token_prefix}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  to="/patient/book-appointment"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"
                >
                  <span>Book Consultation in {dept.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Departments;
