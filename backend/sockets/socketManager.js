const jwt = require('jsonwebtoken');
const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { ROLES } = require('../config/constants');

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.patientSockets = new Map(); // patientId -> Set of socketIds
  }

  init(io) {
    this.io = io;

    // Socket.IO JWT authentication middleware
    io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sqms_jwt_super_secret_key_2026');
          
          // Resolve linked patient or doctor profile
          let user = null;
          let patient = null;
          let doctor = null;

          if (isSupabaseConfigured && supabase) {
            const { data: u } = await supabase.from('users').select('id, name, email, role, mobile').eq('id', decoded.id).maybeSingle();
            user = u;
            if (user?.role === ROLES.PATIENT) {
              const { data: p } = await supabase.from('patients').select('*').eq('user_id', user.id).maybeSingle();
              patient = p;
            } else if (user?.role === ROLES.DOCTOR) {
              const { data: d } = await supabase.from('doctors').select('*').eq('user_id', user.id).maybeSingle();
              doctor = d;
            }
          } else {
            user = memoryStore.users.find(u => u.id === decoded.id);
            if (user?.role === ROLES.PATIENT) {
              patient = memoryStore.patients.find(p => p.user_id === user.id);
            } else if (user?.role === ROLES.DOCTOR) {
              doctor = memoryStore.doctors.find(d => d.user_id === user.id);
            }
          }

          socket.user = user || decoded;
          socket.patient = patient;
          socket.doctor = doctor;
        } catch (err) {
          console.warn('Socket token verify failed:', err.message);
        }
      }
      next();
    });

    io.on('connection', (socket) => {
      const userEmail = socket.user?.email || 'Anonymous';
      console.log(`⚡ Socket connected: ${socket.id} (User: ${userEmail}, Role: ${socket.user?.role || 'Guest'})`);

      // 1. Patient Join Room (Authorized from token or verified identity)
      socket.on('patient:join', (payload = {}) => {
        let targetPatientId = null;

        if (socket.patient?.id) {
          // Guaranteed safe from authenticated token
          targetPatientId = socket.patient.id;
        } else if (socket.user?.role === ROLES.ADMIN || socket.user?.role === ROLES.DOCTOR) {
          // Staff can inspect specific patient room
          targetPatientId = payload.patientId;
        } else if (payload.patientId && !socket.user) {
          // Fallback if token is refreshing
          targetPatientId = payload.patientId;
        }

        if (targetPatientId) {
          const roomName = `patient:${targetPatientId}`;
          socket.join(roomName);
          console.log(`👤 Socket ${socket.id} joined private patient room: ${roomName}`);
          
          if (!this.patientSockets.has(targetPatientId)) {
            this.patientSockets.set(targetPatientId, new Set());
          }
          this.patientSockets.get(targetPatientId).add(socket.id);
        }

        if (socket.user?.id) {
          socket.join(`user:${socket.user.id}`);
        }
      });

      // 2. Doctor Join Room (Restricted to DOCTOR / ADMIN)
      socket.on('doctor:join', (payload = {}) => {
        const isStaff = socket.user?.role === ROLES.DOCTOR || socket.user?.role === ROLES.ADMIN;
        const targetDoctorId = socket.doctor?.id || (isStaff ? payload.doctorId : null);
        const targetDeptId = socket.doctor?.department_id || (isStaff ? payload.departmentId : null);

        if (targetDoctorId) {
          socket.join(`doctor:${targetDoctorId}`);
          console.log(`👨‍⚕️ Doctor joined room: doctor:${targetDoctorId}`);
        }
        if (targetDeptId) {
          socket.join(`department:${targetDeptId}`);
          console.log(`🏥 Doctor joined department room: department:${targetDeptId}`);
        }
      });

      // 3. Queue Display / Public TV Join
      socket.on('display:join', ({ departmentId } = {}) => {
        socket.join('queue:display');
        if (departmentId) {
          socket.join(`display:department:${departmentId}`);
        }
        console.log(`📺 TV / Public Display client joined queue display broadcast.`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
        for (const [patientId, sockets] of this.patientSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.patientSockets.delete(patientId);
            }
          }
        }
      });
    });
  }

  // Targeted notification ONLY to the specific patient
  emitToPatient(patientId, eventName, payload) {
    if (!this.io) return;
    const roomName = `patient:${patientId}`;
    console.log(`🎯 [SOCKET TARGETED EMIT] Event: '${eventName}' to room: '${roomName}'`);
    this.io.to(roomName).emit(eventName, payload);
  }

  // Notification to a specific doctor
  emitToDoctor(doctorId, eventName, payload) {
    if (!this.io) return;
    this.io.to(`doctor:${doctorId}`).emit(eventName, payload);
  }

  // Broadcast queue update to all relevant subscribers & TV display
  emitQueueUpdate(data) {
    if (!this.io) return;
    console.log(`📢 [SOCKET BROADCAST] Emitting 'queue:update'`);
    this.io.emit('queue:update', data);
    this.io.to('queue:display').emit('queue:update', data);
    if (data.department_id) {
      this.io.to(`department:${data.department_id}`).emit('queue:update', data);
    }
    if (data.doctor_id) {
      this.io.to(`doctor:${data.doctor_id}`).emit('queue:update', data);
    }
  }

  // High-priority patient called announcement for TV display and Doctor room
  emitPatientCalledBroadcast(data) {
    if (!this.io) return;
    this.io.to('queue:display').emit('patient:called', data);
    if (data.doctorId) {
      this.io.to(`doctor:${data.doctorId}`).emit('patient:called', data);
    }
    if (data.departmentId) {
      this.io.to(`department:${data.departmentId}`).emit('patient:called', data);
    }
  }
}

module.exports = new SocketManager();

