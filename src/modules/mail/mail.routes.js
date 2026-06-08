const express = require('express');
const router = express.Router();
const mailController = require('./mail.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  createMailSchema,
  updateStatusSchema,
  assignMailSchema,
  listMailSchema,
  mailIdParamSchema,
  addCommentSchema,
} = require('./mail.validation');
const { ROLES } = require('../../utils/constants');

router.use(authMiddleware);

// Stats
router.get(
  '/stats',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  mailController.getMailStats
);

// Mail CRUD
router.get('/', validate(listMailSchema), mailController.getAllMails);

router.post(
  '/',
  roleMiddleware(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.SECRETARY),
  validate(createMailSchema),
  mailController.createMail
);

router.get(
  '/user/:id',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SERVICE_LEAD),
  mailController.getMailsByUser
);

router.get('/:id', validate(mailIdParamSchema), mailController.getMailById);
// ── AI Summarize on demand ────────────────────────────────────────────────────
router.post(
  '/:id/summarize',
  validate(mailIdParamSchema),
  mailController.summarizeMail
);

router.put(
  '/:id/status',
  validate(updateStatusSchema),
  mailController.updateMailStatus
);

router.put(
  '/:id/assign',
  roleMiddleware(ROLES.DIRECTOR, ROLES.ADMIN),
  validate(assignMailSchema),
  mailController.assignMail
);

// Comments
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  mailController.addComment
);

router.get(
  '/:id/comments',
  validate(mailIdParamSchema),
  mailController.getComments
);

// ── PDF Upload ────────────────────────────────────────────────────────────────
router.post('/upload', roleMiddleware(ROLES.SECRETARY, ROLES.ADMIN, ROLES.DIRECTOR), (req, res, next) => {
  try {
    const { filename, data, mimeType } = req.body;
    if (!data || !filename) return res.status(400).json({ success: false, message: 'filename and data are required' });

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ success: false, message: 'Only PDF and images are allowed' });

    const uploadsDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(filename) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    const safeName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    res.json({ success: true, data: { pdfUrl: `/uploads/${safeName}` } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;