const express = require('express');
const router = express.Router();
const ctrl = require('./notification.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', ctrl.getMyNotifications);
router.put('/read-all', ctrl.markAllRead);
router.put('/:id/read', ctrl.markOneRead);
router.delete('/:id',ctrl.deleteOne);

module.exports = router;