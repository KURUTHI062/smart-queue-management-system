const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public queue display for TVs / Waiting area
router.get('/', queueController.getQueue);

// Patient live queue position
router.get('/my', requireAuth, queueController.getMyQueue);

// Doctor console queue view
router.get('/doctor/:doctorId', requireAuth, queueController.getDoctorQueue);

// Doctor queue actions (Calling next, recalling, starting, skipping, completing, no-show)
router.post('/call-next', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.callNext);
router.post('/:id/recall', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.recall);
router.post('/:id/start', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.startConsultation);
router.post('/:id/start-consultation', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.startConsultation);
router.post('/:id/skip', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.skip);
router.post('/:id/complete', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.complete);
router.post('/:id/no-show', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN), queueController.noShow);

module.exports = router;
