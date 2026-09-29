const { memoryStore, supabase, isSupabaseConfigured } = require('../config/db');

// GET /api/notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const patientId = req.patient?.id;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient profile not found.' });
    }

    let list = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      list = data || [];
    } else {
      list = memoryStore.notifications
        .filter(n => n.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const unreadCount = list.filter(n => !n.is_read).length;

    return res.json({
      success: true,
      unreadCount,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      const patientId = req.patient?.id;
      if (isSupabaseConfigured && supabase) {
        await supabase.from('notifications').update({ is_read: true }).eq('patient_id', patientId);
      } else {
        memoryStore.notifications.forEach(n => {
          if (n.patient_id === patientId) n.is_read = true;
        });
      }
      return res.json({ success: true, message: 'All notifications marked as read' });
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      const notif = memoryStore.notifications.find(n => n.id === id);
      if (notif) notif.is_read = true;
    }

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markRead
};
