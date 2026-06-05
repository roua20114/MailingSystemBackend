const express = require('express');
const router = express.Router();
const senderController = require('./sender.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createSenderSchema } = require('./sender.validation');
const { ROLES } = require('../../utils/constants');

router.get('/', authMiddleware, senderController.getAllSenders);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SECRETARY, ROLES.DIRECTOR),
  validate(createSenderSchema),
  senderController.createSender
);

module.exports = router;
