const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/departments
const getDepartments = async (req, res, next) => {
  try {
    let departments = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      departments = data || [];
    } else {
      departments = [...memoryStore.departments].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Attach doctor count and active waiting queue count
    const enriched = departments.map(dept => {
      let doctorCount = 0;
      let waitingCount = 0;

      if (isSupabaseConfigured && supabase) {
        // Will be enriched if needed
      } else {
        doctorCount = memoryStore.doctors.filter(d => d.department_id === dept.id).length;
        waitingCount = memoryStore.queue.filter(q => q.department_id === dept.id && q.status === 'WAITING').length;
      }

      return {
        ...dept,
        doctor_count: doctorCount,
        waiting_count: waitingCount
      };
    });

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /api/departments (Admin)
const createDepartment = async (req, res, next) => {
  try {
    const { name, description, code, token_prefix } = req.body;
    if (!name || !token_prefix) {
      return res.status(400).json({ success: false, message: 'Name and token prefix are required' });
    }

    const newDept = {
      id: uuidv4(),
      name: name.trim(),
      description: description || '',
      code: code ? code.toUpperCase().trim() : name.substring(0, 4).toUpperCase(),
      token_prefix: token_prefix.toUpperCase().trim(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('departments').insert([newDept]).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Department created', data });
    } else {
      memoryStore.departments.push(newDept);
      return res.status(201).json({ success: true, message: 'Department created', data: newDept });
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/departments/:id (Admin)
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, code, token_prefix } = req.body;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('departments')
        .update({ name, description, code, token_prefix })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, message: 'Department updated', data });
    } else {
      const idx = memoryStore.departments.findIndex(d => d.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Department not found' });

      memoryStore.departments[idx] = {
        ...memoryStore.departments[idx],
        name: name || memoryStore.departments[idx].name,
        description: description !== undefined ? description : memoryStore.departments[idx].description,
        code: code || memoryStore.departments[idx].code,
        token_prefix: token_prefix || memoryStore.departments[idx].token_prefix
      };
      return res.json({ success: true, message: 'Department updated', data: memoryStore.departments[idx] });
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /api/departments/:id (Admin)
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    } else {
      const idx = memoryStore.departments.findIndex(d => d.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Department not found' });
      memoryStore.departments.splice(idx, 1);
    }
    return res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
