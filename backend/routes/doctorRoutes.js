const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public route to view doctors
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);

// Admin-only management routes
router.post('/', requireAuth, requireRole(ROLES.ADMIN), doctorController.createDoctor);
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), doctorController.updateDoctor);
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), doctorController.deleteDoctor);

module.exports = router;
