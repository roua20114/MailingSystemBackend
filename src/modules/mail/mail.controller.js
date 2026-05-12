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

module.exports = {
  getAllMails,
  getMailById,
  createMail,
  updateMailStatus,
  assignMail,
  getMailsByUser,
  addComment,
  getComments,
  getMailStats,
};
