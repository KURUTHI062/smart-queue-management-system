const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Admin-only endpoints
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/statistics', adminController.getStatistics);
router.get('/patients', adminController.getPatients);
router.get('/reports', adminController.getReports);
router.post('/priority-config', adminController.updatePriorityConfig);
router.get('/notification-logs', adminController.getNotificationLogs);

module.exports = router;
