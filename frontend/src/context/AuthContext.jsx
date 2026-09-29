import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sqms_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sqms_token') || null);
  const [patient, setPatient] = useState(() => {
    const saved = localStorage.getItem('sqms_patient');
    return saved ? JSON.parse(saved) : null;
  });
  const [doctor, setDoctor] = useState(() => {
    const saved = localStorage.getItem('sqms_doctor');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Rehydrate fresh session from backend on mount or token change
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('sqms_token');
    if (!savedToken) {
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const freshUser = res.data.data.user;
        const freshPatient = res.data.data.patient || null;
        const freshDoctor = res.data.data.doctor || null;

        setUser(freshUser);
        setPatient(freshPatient);
        setDoctor(freshDoctor);

        localStorage.setItem('sqms_user', JSON.stringify(freshUser));
        if (freshPatient) localStorage.setItem('sqms_patient', JSON.stringify(freshPatient));
        else localStorage.removeItem('sqms_patient');
        if (freshDoctor) localStorage.setItem('sqms_doctor', JSON.stringify(freshDoctor));
        else localStorage.removeItem('sqms_doctor');

        return freshUser;
      }
    } catch (err) {
      console.warn('Session verification expired:', err.message);
      // If token expired, clear session
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login with Email OR Mobile and Password
  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data?.success) {
      const { token: newToken, user: newUser, patient: newPat, doctor: newDoc } = res.data.data;
      setToken(newToken);
      setUser(newUser);
      setPatient(newPat || null);
      setDoctor(newDoc || null);

      localStorage.setItem('sqms_token', newToken);
      localStorage.setItem('sqms_user', JSON.stringify(newUser));
      if (newPat) localStorage.setItem('sqms_patient', JSON.stringify(newPat));
      if (newDoc) localStorage.setItem('sqms_doctor', JSON.stringify(newDoc));
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // Patient Registration
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.success) {
      const { token: newToken, user: newUser, patient: newPat } = res.data.data;
      setToken(newToken);
      setUser(newUser);
      setPatient(newPat || null);

      localStorage.setItem('sqms_token', newToken);
      localStorage.setItem('sqms_user', JSON.stringify(newUser));
      if (newPat) localStorage.setItem('sqms_patient', JSON.stringify(newPat));
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data?.success) {
      await refreshUser();
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
    return res.data;
  };

  // Forgot Password Request
  const forgotPassword = async (identifier) => {
    const res = await api.post('/auth/forgot-password', { identifier });
    return res.data;
  };

  // Reset Password Execution
  const resetPassword = async (resetCode, newPassword, confirmNewPassword) => {
    const res = await api.post('/auth/reset-password', {
      resetCode,
      newPassword,
      confirmNewPassword
    });
    return res.data;
  };

  // Logout & Clean Storage
  const logout = () => {
    setToken(null);
    setUser(null);
    setPatient(null);
    setDoctor(null);
    localStorage.removeItem('sqms_token');
    localStorage.removeItem('sqms_user');
    localStorage.removeItem('sqms_patient');
    localStorage.removeItem('sqms_doctor');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        doctor,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

