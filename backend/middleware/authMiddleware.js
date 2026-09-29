const jwt = require('jsonwebtoken');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sqms_jwt_super_secret_key_2026');
    
    // Fetch fresh user profile
    let user = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('users').select('id, name, email, role, mobile').eq('id', decoded.id).single();
      user = data;
    }
    if (!user) {
      user = memoryStore.users.find(u => u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;

    // Attach linked patient/doctor record
    if (user.role === 'PATIENT') {
      let patient = null;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('patients').select('*').eq('user_id', user.id).single();
        patient = data;
      }
      if (!patient) {
        patient = memoryStore.patients.find(p => p.user_id === user.id);
      }
      req.patient = patient;
    } else if (user.role === 'DOCTOR') {
      let doctor = null;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('doctors').select('*').eq('user_id', user.id).single();
        doctor = data;
      }
      if (!doctor) {
        doctor = memoryStore.doctors.find(d => d.user_id === user.id);
      }
      req.doctor = doctor;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Current role: ${req.user?.role || 'None'}`
      });
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};
