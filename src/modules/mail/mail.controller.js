const mailService = require('./mail.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

const getAllMails = async (req, res, next) => {
  try {
    const { mails, total } = await mailService.getAllMails(req.query, req.user);
    const { page = 1, limit = 10 } = req.query;
    sendPaginated(res, mails, total, page, limit, 'Mails retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMailById = async (req, res, next) => {
  try {
    const mail = await mailService.getMailById(req.params.id, req.user);
    sendSuccess(res, { mail }, 'Mail retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createMail = async (req, res, next) => {
  try {
    const { mail, aiMetadata } = await mailService.createMail(req.body, req);
    sendSuccess(res, { mail, aiMetadata }, 'Mail registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateMailStatus = async (req, res, next) => {
  try {
    const mail = await mailService.updateMailStatus(req.params.id, req.body, req);
    sendSuccess(res, { mail }, 'Mail status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * dispatchMail — PATCH /api/mails/:id/dispatch
 *
 * Réservé au Directeur. Affecte le courrier à un ou plusieurs départements.
 *
 * Body attendu (JSON) :
 * {
 *   "dispatchedTo":  ["<deptId1>", "<deptId2>"],   // OBLIGATOIRE — tableau min 1
 *   "assignedTo":    "<userId>",                     // facultatif
 *   "instructions":  "Traiter avant le 15/07",       // facultatif
 *   "priority":      "High"                          // facultatif
 * }
 */
const dispatchMail = async (req, res, next) => {
  try {
    const mail = await mailService.dispatchMail(req.params.id, req.body, req);
    sendSuccess(res, { mail }, 'Mail dispatched successfully');
  } catch (error) {
    next(error);
  }
};

const assignMail = async (req, res, next) => {
  try {
    const mail = await mailService.assignMail(req.params.id, req.body, req);
    sendSuccess(res, { mail }, 'Mail assigned successfully');
  } catch (error) {
    next(error);
  }
};

const getMailsByUser = async (req, res, next) => {
  try {
    const { mails, total } = await mailService.getMailsByUser(req.params.id, req.query);
    const { page = 1, limit = 10 } = req.query;
    sendPaginated(res, mails, total, page, limit, 'User mails retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const comment = await mailService.addComment(req.params.id, req.user._id, req.body);
    sendSuccess(res, { comment }, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const comments = await mailService.getComments(req.params.id);
    sendSuccess(res, { comments }, 'Comments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMailStats = async (req, res, next) => {
  try {
    const stats = await mailService.getMailStats();
    sendSuccess(res, { stats }, 'Mail statistics retrieved');
  } catch (error) {
    next(error);
  }
};
const summarizeMail = async (req, res, next) => {
  try {
    const mail = await mailService.summarizeMail(req.params.id, req.user);
    sendSuccess(res, { mail }, 'Résumé généré avec succès');
  } catch (error) {
    next(error);
  }
};
const markMail = async (req, res, next) => {
  try {
    const mail = await mailService.getMailById(req.params.id, req.user);
    if (!mail) throw new Error('Mail not found');
    if (mail.isMarked) {
      return res.status(400).json({ success: false, message: 'Ce courrier est déjà marqué' });
    }
    // Use the generic updateStatus or a direct model update via mailService
    const Mail = require('../mail/mail.model');
    const updated = await Mail.findByIdAndUpdate(
      req.params.id,
      { isMarked: true },
      { new: true }
    );
    res.json({ success: true, data: { mail: updated } });
  } catch (err) {
    next(err);
  }
};

// Ajoute aussi dans module.exports :
// summarizeMail,

module.exports = {
  getAllMails,
  getMailById,
  createMail,
  updateMailStatus,
  dispatchMail,
  assignMail,
  getMailsByUser,
  addComment,
  getComments,
  getMailStats,
  summarizeMail,
  markMail,
};