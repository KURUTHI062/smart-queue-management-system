const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.get('/', departmentController.getDepartments);
router.post('/', requireAuth, requireRole(ROLES.ADMIN), departmentController.createDepartment);
router.put('/:id', requireAuth, requireRole(ROLES.ADMIN), departmentController.updateDepartment);
router.delete('/:id', requireAuth, requireRole(ROLES.ADMIN), departmentController.deleteDepartment);

module.exports = router;
