const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { ROLES } = require('../config/constants');

// In-memory store for password reset tokens
const resetTokens = new Map(); // token -> { userId, expiresAt }

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, mobile: user.mobile, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'sqms_jwt_super_secret_key_2026',
    { expiresIn: '7d' }
  );
};

// Helper: Normalize mobile number (remove spaces, dashes)
const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  return mobile.replace(/[\s\-\(\)]/g, '').trim();
};

// Helper: Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// POST /api/auth/register (Patient self-registration)
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      whatsappOptIn = true
    } = req.body;

    // 1. Validation - Required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    
    const cleanMobile = normalizeMobile(mobile);
    if (cleanMobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }
    if (!dateOfBirth) {
      return res.status(400).json({ success: false, message: 'Date of Birth is required.' });
    }
    if (!gender) {
      return res.status(400).json({ success: false, message: 'Gender is required.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Residential address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check duplicate email or mobile
    if (isSupabaseConfigured && supabase) {
      const { data: existingByEmail } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
      if (existingByEmail) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      }

      const { data: existingByMobile } = await supabase.from('users').select('id').eq('mobile', cleanMobile).maybeSingle();
      if (existingByMobile) {
        return res.status(400).json({ success: false, message: 'An account with this mobile number already exists.' });
      }
    } else {
      const duplicateEmail = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (duplicateEmail) {
        return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      }

      const duplicateMobile = memoryStore.users.find(u => normalizeMobile(u.mobile) === cleanMobile);
      if (duplicateMobile) {
        return res.status(400).json({ success: false, message: 'An account with this mobile number already exists.' });
      }
    }

    // 3. Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const patientId = uuidv4();
    const createdAt = new Date().toISOString();

    const newUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      mobile: cleanMobile,
      password_hash: passwordHash,
      password: passwordHash, // backward compatibility
      role: ROLES.PATIENT,
      status: 'ACTIVE',
      created_at: createdAt,
      updated_at: createdAt
    };

    const newPatient = {
      id: patientId,
      user_id: userId,
      date_of_birth: dateOfBirth,
      gender: gender,
      address: address.trim(),
      emergency_contact: emergencyContact ? emergencyContact.trim() : '',
      whatsapp_opt_in: whatsappOptIn !== false,
      created_at: createdAt
    };

    if (isSupabaseConfigured && supabase) {
      const { error: uErr } = await supabase.from('users').insert([{
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        password_hash: newUser.password_hash,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }]);
      if (uErr) throw uErr;

      const { error: pErr } = await supabase.from('patients').insert([newPatient]);
      if (pErr) throw pErr;
    } else {
      memoryStore.users.push(newUser);
      memoryStore.patients.push(newPatient);
    }

    const token = generateToken(newUser);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      role: newUser.role,
      status: newUser.status,
      created_at: newUser.created_at
    };

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to SmartCare.',
      data: {
        token,
        user: safeUser,
        patient: newPatient
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login (User-defined login with Email OR Mobile)
const login = async (req, res, next) => {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginInput = (identifier || email || mobile || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your Email/Mobile Number and Password.' });
    }

    const normalizedInput = loginInput.toLowerCase();
    const cleanMobileInput = normalizeMobile(loginInput);

    let user = null;

    if (isSupabaseConfigured && supabase) {
      // Try searching by email first
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedInput)
        .maybeSingle();

      if (userByEmail) {
        user = userByEmail;
      } else if (cleanMobileInput.length >= 10) {
        // Try searching by mobile
        const { data: userByMobile } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', cleanMobileInput)
          .maybeSingle();
        user = userByMobile;
      }
    } else {
      user = memoryStore.users.find(u => 
        u.email.toLowerCase() === normalizedInput || 
        (cleanMobileInput.length >= 10 && normalizeMobile(u.mobile) === cleanMobileInput)
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile number or password.' });
    }

    if (user.status && user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact hospital admin.' });
    }

    // Verify password with bcrypt
    const storedHash = user.password_hash || user.password;
    const isMatch = await bcrypt.compare(password, storedHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile number or password.' });
    }

    // Load related role entity
    let patientData = null;
    let doctorData = null;

    if (user.role === ROLES.PATIENT) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('patients').select('*').eq('user_id', user.id).maybeSingle();
        patientData = data;
      } else {
        patientData = memoryStore.patients.find(p => p.user_id === user.id);
      }
    } else if (user.role === ROLES.DOCTOR) {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('doctors').select('*, departments(*)').eq('user_id', user.id).maybeSingle();
        doctorData = data;
      } else {
        const doc = memoryStore.doctors.find(d => d.user_id === user.id);
        if (doc) {
          const dept = memoryStore.departments.find(dep => dep.id === doc.department_id);
          doctorData = { ...doc, departments: dept };
        }
      }
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status || 'ACTIVE',
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: safeUser,
        patient: patientData,
        doctor: doctorData
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me (Get fresh authenticated profile)
const getMe = async (req, res) => {
  const safeUser = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    mobile: req.user.mobile,
    role: req.user.role,
    status: req.user.status || 'ACTIVE',
    created_at: req.user.created_at
  };

  return res.json({
    success: true,
    data: {
      user: safeUser,
      patient: req.patient,
      doctor: req.doctor
    }
  });
};

// PUT /api/auth/profile (Update personal profile info)
const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile, date_of_birth, gender, address, emergency_contact, specialization, room_number } = req.body;
    const userId = req.user.id;
    const updatedAt = new Date().toISOString();

    const cleanMobile = mobile ? normalizeMobile(mobile) : req.user.mobile;

    // Check duplicate mobile if changing mobile
    if (cleanMobile && cleanMobile !== req.user.mobile) {
      let duplicateMobile = null;
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('users').select('id').eq('mobile', cleanMobile).neq('id', userId).maybeSingle();
        duplicateMobile = data;
      } else {
        duplicateMobile = memoryStore.users.find(u => normalizeMobile(u.mobile) === cleanMobile && u.id !== userId);
      }
      if (duplicateMobile) {
        return res.status(400).json({ success: false, message: 'Another account with this mobile number already exists.' });
      }
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').update({
        name: name ? name.trim() : req.user.name,
        mobile: cleanMobile,
        updated_at: updatedAt
      }).eq('id', userId);

      if (req.user.role === ROLES.PATIENT && req.patient?.id) {
        await supabase.from('patients').update({
          date_of_birth: date_of_birth || req.patient.date_of_birth,
          gender: gender || req.patient.gender,
          address: address !== undefined ? address.trim() : req.patient.address,
          emergency_contact: emergency_contact !== undefined ? emergency_contact.trim() : req.patient.emergency_contact
        }).eq('id', req.patient.id);
      } else if (req.user.role === ROLES.DOCTOR && req.doctor?.id) {
        await supabase.from('doctors').update({
          specialization: specialization || req.doctor.specialization,
          room_number: room_number || req.doctor.room_number
        }).eq('id', req.doctor.id);
      }
    } else {
      const userIdx = memoryStore.users.findIndex(u => u.id === userId);
      if (userIdx !== -1) {
        if (name) memoryStore.users[userIdx].name = name.trim();
        if (cleanMobile) memoryStore.users[userIdx].mobile = cleanMobile;
        memoryStore.users[userIdx].updated_at = updatedAt;
      }

      if (req.user.role === ROLES.PATIENT) {
        const pIdx = memoryStore.patients.findIndex(p => p.user_id === userId);
        if (pIdx !== -1) {
          if (date_of_birth) memoryStore.patients[pIdx].date_of_birth = date_of_birth;
          if (gender) memoryStore.patients[pIdx].gender = gender;
          if (address !== undefined) memoryStore.patients[pIdx].address = address.trim();
          if (emergency_contact !== undefined) memoryStore.patients[pIdx].emergency_contact = emergency_contact.trim();
        }
      } else if (req.user.role === ROLES.DOCTOR) {
        const dIdx = memoryStore.doctors.findIndex(d => d.user_id === userId);
        if (dIdx !== -1) {
          if (specialization) memoryStore.doctors[dIdx].specialization = specialization;
          if (room_number) memoryStore.doctors[dIdx].room_number = room_number;
        }
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully!'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    // Retrieve user with password hash
    let user = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      user = data;
    } else {
      user = memoryStore.users.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const storedHash = user.password_hash || user.password;
    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'The current password you entered is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').update({
        password_hash: newHash,
        updated_at: updatedAt
      }).eq('id', userId);
    } else {
      const idx = memoryStore.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        memoryStore.users[idx].password_hash = newHash;
        memoryStore.users[idx].password = newHash;
        memoryStore.users[idx].updated_at = updatedAt;
      }
    }

    return res.json({
      success: true,
      message: 'Password changed successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email or mobile number.' });
    }

    const normalizedInput = identifier.toLowerCase().trim();
    const cleanMobileInput = normalizeMobile(identifier);

    let user = null;
    if (isSupabaseConfigured && supabase) {
      const { data: uEmail } = await supabase.from('users').select('id, email, name').eq('email', normalizedInput).maybeSingle();
      user = uEmail;
      if (!user && cleanMobileInput.length >= 10) {
        const { data: uMobile } = await supabase.from('users').select('id, email, name').eq('mobile', cleanMobileInput).maybeSingle();
        user = uMobile;
      }
    } else {
      user = memoryStore.users.find(u => 
        u.email.toLowerCase() === normalizedInput || 
        (cleanMobileInput.length >= 10 && normalizeMobile(u.mobile) === cleanMobileInput)
      );
    }

    // Security best practice: Always return generic response to prevent user enumeration
    if (user) {
      const resetToken = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase(); // 8-char verification code
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
      resetTokens.set(resetToken, { userId: user.id, expiresAt });
      
      console.log(`🔐 [PASSWORD RESET CODE] Generated code for user ${user.email}: ${resetToken}`);
      
      return res.json({
        success: true,
        message: 'If an account exists with this credential, a verification reset code has been sent.',
        devToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
      });
    }

    return res.json({
      success: true,
      message: 'If an account exists with this credential, a verification reset code has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { resetCode, newPassword, confirmNewPassword } = req.body;

    if (!resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset code and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmation do not match.' });
    }

    const tokenEntry = resetTokens.get(resetCode.trim().toUpperCase());
    if (!tokenEntry || tokenEntry.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code. Please request a new one.' });
    }

    const userId = tokenEntry.userId;
    const newHash = await bcrypt.hash(newPassword, 10);
    const updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').update({
        password_hash: newHash,
        updated_at: updatedAt
      }).eq('id', userId);
    } else {
      const idx = memoryStore.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        memoryStore.users[idx].password_hash = newHash;
        memoryStore.users[idx].password = newHash;
        memoryStore.users[idx].updated_at = updatedAt;
      }
    }

    resetTokens.delete(resetCode.trim().toUpperCase());

    return res.json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
