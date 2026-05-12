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

router.get('/', roleMiddleware(ROLES.ADMIN), validate(listUsersSchema), userController.getAllUsers);
router.post('/', roleMiddleware(ROLES.ADMIN), validate(createUserSchema), userController.createUser);
router.get('/:id', roleMiddleware(ROLES.ADMIN), validate(userIdParamSchema), userController.getUserById);
router.put('/:id', roleMiddleware(ROLES.ADMIN), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', roleMiddleware(ROLES.ADMIN), validate(userIdParamSchema), userController.deleteUser);

module.exports = router;
