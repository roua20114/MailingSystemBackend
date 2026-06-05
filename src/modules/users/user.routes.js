const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersSchema,
} = require('./user.validation');
const { ROLES } = require('../../utils/constants');

router.use(authMiddleware);

// ── Notification preferences (tous les utilisateurs connectés) ────────────────
// ⚠️  Ces routes DOIVENT être déclarées AVANT router.get('/:id')
//     pour ne pas être interceptées par le param :id
router.get('/notification-settings', userController.getNotificationSettings);
router.patch('/notification-settings', userController.updateNotificationSettings);

// ── CRUD Users ────────────────────────────────────────────────────────────────

// GET endpoints: Admin + Director
router.get('/', roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(listUsersSchema), userController.getAllUsers);
router.get('/:id', roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(userIdParamSchema), userController.getUserById);

// Write endpoints: Admin only
router.post('/', roleMiddleware(ROLES.ADMIN), validate(createUserSchema), userController.createUser);
router.put('/:id', roleMiddleware(ROLES.ADMIN), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', roleMiddleware(ROLES.ADMIN), validate(userIdParamSchema), userController.deleteUser);

module.exports = router;