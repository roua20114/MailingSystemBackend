const Notification = require('./notification.model');
const { sendSuccess } = require('../../utils/response');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false,
    });
    sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (err) { next(err); }
};

const markOneRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true }
    );
    sendSuccess(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { read: true }
    );
    sendSuccess(res, null, 'All marked as read');
  } catch (err) { next(err); }
};

const deleteOne = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipientId: req.user._id });
    sendSuccess(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markOneRead, markAllRead, deleteOne };