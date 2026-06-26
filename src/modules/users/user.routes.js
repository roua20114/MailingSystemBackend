const express = require('express');
const router = express.Router();
const User = require('./user.model');
const AppError = require('../../utils/AppError');
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
// Add after the existing routes, before module.exports:

// ── Account activation — Admin + Director ─────────────────────────────────────
router.patch(
  '/:id/activate',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  validate(userIdParamSchema),
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true }
      );
      if (!user) throw new AppError('Utilisateur introuvable', 404);
      res.json({ success: true, data: { user }, message: 'Compte activé avec succès' });
    } catch (err) { next(err); }
  }
);

router.patch(
  '/:id/deactivate',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  validate(userIdParamSchema),
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      if (!user) throw new AppError('Utilisateur introuvable', 404);
      res.json({ success: true, data: { user }, message: 'Compte désactivé' });
    } catch (err) { next(err); }
  }
);

// Write endpoints: Admin only
router.post('/', roleMiddleware(ROLES.ADMIN , ROLES.DIRECTOR), validate(createUserSchema), userController.createUser);
router.put('/:id', roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR), validate(userIdParamSchema), userController.deleteUser);

module.exports = router;