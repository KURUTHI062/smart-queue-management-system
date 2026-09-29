import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, patient, doctor, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastQueueUpdate, setLastQueueUpdate] = useState(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Audio / Speech Synthesizer for Hospital Call Announcements
  const playAnnouncementAudio = useCallback((text) => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      // 1. Synthesize Web Audio chime
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);

      // 2. Web Speech Voice Synthesizer
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any pending speech
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }, 500);
      }
    } catch (err) {
      console.warn('Audio playback error:', err.message);
    }
  }, [soundEnabled]);

  useEffect(() => {
    // Connect to backend Socket.IO
    const newSocket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to SmartCare WebSocket Server:', newSocket.id);
      setConnected(true);

      // Auto-join relevant rooms based on authenticated user
      if (patient?.id) {
        newSocket.emit('patient:join', { patientId: patient.id, userId: user?.id });
      }
      if (doctor?.id) {
        newSocket.emit('doctor:join', { doctorId: doctor.id, departmentId: doctor.department_id });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setConnected(false);
    });

    // Global Queue Update Broadcast
    newSocket.on('queue:update', (data) => {
      console.log('📢 Received queue:update broadcast:', data);
      setLastQueueUpdate(data);
    });

    // Hospital Patient Called Announcement
    newSocket.on('patient:called', (data) => {
      console.log('🚨 Received patient:called event:', data);
      setLatestAnnouncement(data);

      const speechText = data.isRecall
        ? `Reminder: Token ${data.tokenNumber}, please proceed to ${data.roomNumber}, ${data.doctorName || 'Doctor'}.`
        : `Token number ${data.tokenNumber}, please proceed to ${data.roomNumber}, ${data.doctorName || 'Doctor'}.`;

      playAnnouncementAudio(speechText);
    });

    // Private Targeted Notifications
    newSocket.on('notification:new', (notif) => {
      console.log('📬 Received private notification:', notif);
      setNotifications((prev) => [notif, ...prev]);
      setUnreadNotifsCount((prev) => prev + 1);

      if (notif.type === 'YOUR_TURN') {
        playAnnouncementAudio(`Attention! It is now your turn for consultation.`);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [patient?.id, doctor?.id, user?.id, token, playAnnouncementAudio]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        lastQueueUpdate,
        latestAnnouncement,
        setLatestAnnouncement,
        soundEnabled,
        setSoundEnabled,
        playAnnouncementAudio,
        notifications,
        setNotifications,
        unreadNotifsCount,
        setUnreadNotifsCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
