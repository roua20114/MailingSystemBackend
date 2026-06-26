const express        = require('express');
const router         = express.Router();
const Demand         = require('./demand.model');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const { ROLES, DEMAND_STATUS } = require('../../utils/constants');
const AppError       = require('../../utils/AppError');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const notifService = require('../../modules/notifications/notification.service');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authMiddleware);

// ── Professor: create demand (always goes through multer, file optional) ──────
router.post(
  '/',
  roleMiddleware(ROLES.PROFESSOR),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { type, subject, description } = req.body;
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const demand = await Demand.create({
        professor: req.user._id,
        type,
        subject,
        description,
        fileUrl,
        statusHistory: [{ status: DEMAND_STATUS.PENDING, changedBy: req.user._id, note: 'Demande créée' }],
      });
      notifService.onDemandCreated(demand, req.user).catch(() => {});

      res.status(201).json({ success: true, data: { demand } });
    } catch (err) { next(err); }
  }
);

// ── Professor: get own demands ───────────────────────────────────────────────
router.get(
  '/my',
  roleMiddleware(ROLES.PROFESSOR),
  async (req, res, next) => {
    try {
      const demands = await Demand.find({ professor: req.user._id })
        .populate('statusHistory.changedBy', 'name role')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: { demands } });
    } catch (err) { next(err); }
  }
);

// ── Admin/Director: get all demands ──────────────────────────────────────────
router.get(
  '/',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  async (req, res, next) => {
    try {
      const demands = await Demand.find()
        .populate('professor', 'name email')
        .populate('statusHistory.changedBy', 'name role')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: { demands } });
    } catch (err) { next(err); }
  }
);

// ── Admin/Director: update demand status ─────────────────────────────────────
router.patch(
  '/:id/status',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  express.json({ limit: '50mb' }),
  async (req, res, next) => {
    try {
      const { status, adminNote, forwardedToDirector, directorResponse, directorAction } = req.body;
      const demand = await Demand.findById(req.params.id);
      if (!demand) throw new AppError('Demand not found', 404);
      const wasAlreadyForwarded = demand.forwardedToDirector;

      let newStatus = status;

      if (forwardedToDirector && !demand.forwardedToDirector) {
        newStatus = DEMAND_STATUS.IN_PROGRESS;
        demand.forwardedToDirector = true;
      }

      if (directorAction === 'accept') {
        newStatus = DEMAND_STATUS.RESOLVED;
        demand.directorResponse = directorResponse || 'Demande acceptée par le Directeur.';
      }

      if (directorAction === 'reject') {
        newStatus = DEMAND_STATUS.REJECTED;
        demand.directorResponse = directorResponse || 'Demande rejetée par le Directeur.';
      }

      if (newStatus) demand.status = newStatus;
      if (adminNote !== undefined) demand.adminNote = adminNote;

      demand.statusHistory.push({
        status: newStatus || demand.status,
        changedBy: req.user._id,
        note: directorAction === 'accept'
          ? '✓ Acceptée par le Directeur'
          : directorAction === 'reject'
            ? '✗ Rejetée par le Directeur'
            : adminNote || `Statut mis à jour par ${req.user.name}`,
      });

      await demand.save();
      await demand.populate('professor', 'name email _id');

    // Notify director when forwarded by admin
      if (forwardedToDirector && !wasAlreadyForwarded) {
        notifService.onDemandForwarded(demand, demand.professor, req.user).catch(() => {});
      }

      // Notify professor when director answers
      if (directorAction === 'accept' || directorAction === 'reject') {
        notifService.onDemandAnswered(demand, demand.professor, req.user).catch(() => {});
      }
      await demand.populate('professor', 'name email');
      await demand.populate('statusHistory.changedBy', 'name role');
      res.json({ success: true, data: { demand } });
    } catch (err) { next(err); }
  }
);

// ── Professor: update own demand (only if still Pending) ─────────────────────
router.patch(
  '/:id',
  roleMiddleware(ROLES.PROFESSOR),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const demand = await Demand.findById(req.params.id);
      if (!demand) throw new AppError('Demande introuvable', 404);
      if (demand.professor.toString() !== req.user._id.toString())
        throw new AppError('Non autorisé', 403);
      if (demand.status !== DEMAND_STATUS.PENDING)
        throw new AppError('Impossible de modifier une demande déjà en cours de traitement', 400);

      const { type, subject, description } = req.body;
      if (type)        demand.type        = type;
      if (subject)     demand.subject     = subject;
      if (description) demand.description = description;
      if (req.file)    demand.fileUrl     = `/uploads/${req.file.filename}`;

      await demand.save();
      res.json({ success: true, data: { demand } });
    } catch (err) { next(err); }
  }
);

// ── Professor: delete own demand (only if still Pending) ─────────────────────
router.delete(
  '/:id',
  roleMiddleware(ROLES.PROFESSOR),
  async (req, res, next) => {
    try {
      const demand = await Demand.findById(req.params.id);
      if (!demand) throw new AppError('Demande introuvable', 404);
      if (demand.professor.toString() !== req.user._id.toString())
        throw new AppError('Non autorisé', 403);
      if (demand.status !== DEMAND_STATUS.PENDING)
        throw new AppError('Impossible de supprimer une demande déjà en cours de traitement', 400);

      await demand.deleteOne();
      res.json({ success: true, message: 'Demande supprimée' });
    } catch (err) { next(err); }
  }
);
module.exports = router;