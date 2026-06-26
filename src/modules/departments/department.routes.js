const express = require('express');
const router = express.Router();
const deptController = require('./department.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createDepartmentSchema, updateDepartmentSchema, deptIdParamSchema } = require('./department.validation');
const { ROLES } = require('../../utils/constants');

// GET / and GET /:id are public — needed by the Register page before login
router.get('/', deptController.getAllDepartments);
router.get('/:id', validate(deptIdParamSchema), deptController.getDepartmentById);

// All write operations require authentication + Admin role
router.post(
  '/',
  authMiddleware,
  roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR),
  validate(createDepartmentSchema),
  deptController.createDepartment
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  validate(updateDepartmentSchema),
  deptController.updateDepartment
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  validate(deptIdParamSchema),
  deptController.deleteDepartment
);

module.exports = router;