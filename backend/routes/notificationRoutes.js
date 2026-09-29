const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, notificationController.getMyNotifications);
router.patch('/:id/read', requireAuth, notificationController.markRead);

module.exports = router;
