const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

// GET /api/doctors
const getDoctors = async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    let doctors = [];
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('doctors').select('*, users(name, email, mobile), departments(name, token_prefix, code)');
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      doctors = (data || []).map(d => ({
        id: d.id,
        user_id: d.user_id,
        name: d.users?.name,
        email: d.users?.email,
        mobile: d.users?.mobile,
        department_id: d.department_id,
        department_name: d.departments?.name,
        token_prefix: d.departments?.token_prefix,
        specialization: d.specialization,
        room_number: d.room_number,
        availability_status: d.availability_status,
        avg_consultation_time: d.avg_consultation_time || 15
      }));
    } else {
      let list = memoryStore.doctors;
      if (departmentId) {
        list = list.filter(d => d.department_id === departmentId);
      }
      doctors = list.map(d => {
        const user = memoryStore.users.find(u => u.id === d.user_id);
        const dept = memoryStore.departments.find(dep => dep.id === d.department_id);
        const waitingCount = memoryStore.queue.filter(q => q.doctor_id === d.id && q.status === 'WAITING').length;
        return {
          id: d.id,
          user_id: d.user_id,
          name: user?.name || 'Dr. Specialist',
          email: user?.email,
          mobile: user?.mobile,
          department_id: d.department_id,
          department_name: dept?.name || 'Department',
          token_prefix: dept?.token_prefix || 'T',
          specialization: d.specialization,
          room_number: d.room_number,
          availability_status: d.availability_status,
          avg_consultation_time: d.avg_consultation_time || 15,
          waiting_count: waitingCount
        };
      });
    }

    return res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doctor = null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, users(name, email, mobile), departments(name, token_prefix)')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        doctor = {
          id: data.id,
          user_id: data.user_id,
          name: data.users?.name,
          email: data.users?.email,
          mobile: data.users?.mobile,
          department_id: data.department_id,
          department_name: data.departments?.name,
          token_prefix: data.departments?.token_prefix,
          specialization: data.specialization,
          room_number: data.room_number,
          availability_status: data.availability_status,
          avg_consultation_time: data.avg_consultation_time || 15
        };
      }
    } else {
      const d = memoryStore.doctors.find(item => item.id === id);
      if (d) {
        const user = memoryStore.users.find(u => u.id === d.user_id);
        const dept = memoryStore.departments.find(dep => dep.id === d.department_id);
        const waitingCount = memoryStore.queue.filter(q => q.doctor_id === d.id && q.status === 'WAITING').length;
        const currentCalled = memoryStore.queue.find(q => q.doctor_id === d.id && q.status === 'CALLED');

        doctor = {
          id: d.id,
          user_id: d.user_id,
          name: user?.name,
          email: user?.email,
          mobile: user?.mobile,
          department_id: d.department_id,
          department_name: dept?.name,
          token_prefix: dept?.token_prefix,
          specialization: d.specialization,
          room_number: d.room_number,
          availability_status: d.availability_status,
          avg_consultation_time: d.avg_consultation_time || 15,
          waiting_count: waitingCount,
          current_token: currentCalled?.token_number || 'None'
        };
      }
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// POST /api/doctors (Admin create doctor)
const createDoctor = async (req, res, next) => {
  try {
    const { name, email, password, mobile, department_id, specialization, room_number, avg_consultation_time } = req.body;
    if (!name || !email || !password || !department_id || !room_number) {
      return res.status(400).json({ success: false, message: 'Name, email, password, department, and room number are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const doctorId = uuidv4();
    const createdAt = new Date().toISOString();

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: ROLES.DOCTOR,
      mobile: mobile || '+919900000000',
      created_at: createdAt,
      updated_at: createdAt
    };

    const newDoctor = {
      id: doctorId,
      user_id: userId,
      department_id,
      specialization: specialization || 'General Specialist',
      room_number: room_number || 'Room 101',
      availability_status: 'AVAILABLE',
      avg_consultation_time: avg_consultation_time ? Number(avg_consultation_time) : 15,
      created_at: createdAt
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('users').insert([newUser]);
      await supabase.from('doctors').insert([newDoctor]);
    } else {
      memoryStore.users.push(newUser);
      memoryStore.doctors.push(newDoctor);
    }

    return res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: { ...newDoctor, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/doctors/:id (Admin update doctor)
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization, room_number, availability_status, avg_consultation_time, department_id } = req.body;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('doctors')
        .update({ specialization, room_number, availability_status, avg_consultation_time, department_id })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, message: 'Doctor updated', data });
    } else {
      const idx = memoryStore.doctors.findIndex(d => d.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Doctor not found' });

      memoryStore.doctors[idx] = {
        ...memoryStore.doctors[idx],
        specialization: specialization || memoryStore.doctors[idx].specialization,
        room_number: room_number || memoryStore.doctors[idx].room_number,
        availability_status: availability_status || memoryStore.doctors[idx].availability_status,
        avg_consultation_time: avg_consultation_time ? Number(avg_consultation_time) : memoryStore.doctors[idx].avg_consultation_time,
        department_id: department_id || memoryStore.doctors[idx].department_id
      };
      return res.json({ success: true, message: 'Doctor updated', data: memoryStore.doctors[idx] });
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /api/doctors/:id
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('doctors').delete().eq('id', id);
    } else {
      const idx = memoryStore.doctors.findIndex(d => d.id === id);
      if (idx !== -1) {
        const doc = memoryStore.doctors[idx];
        memoryStore.doctors.splice(idx, 1);
        const userIdx = memoryStore.users.findIndex(u => u.id === doc.user_id);
        if (userIdx !== -1) memoryStore.users.splice(userIdx, 1);
      }
    }
    return res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
