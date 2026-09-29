const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { requireAuth } = require('../middleware/authMiddleware');

// Authenticated appointment endpoints
router.post('/', requireAuth, appointmentController.bookAppointment);
router.get('/my', requireAuth, appointmentController.getMyAppointments);
router.get('/:id', requireAuth, appointmentController.getAppointmentById);
router.patch('/:id/cancel', requireAuth, appointmentController.cancelAppointment);

module.exports = router;
