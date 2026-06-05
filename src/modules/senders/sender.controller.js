const Sender = require('./sender.model');
const { sendSuccess } = require('../../utils/response');

const getAllSenders = async (req, res, next) => {
  try {
    const senders = await Sender.find().sort({ name: 1 });
    sendSuccess(res, { senders }, 'Senders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createSender = async (req, res, next) => {
  try {
    const sender = await Sender.create(req.body);
    sendSuccess(res, { sender }, 'Sender created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSenders,
  createSender,
};
