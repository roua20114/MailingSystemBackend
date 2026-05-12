const Mail = require('./mail.model');
const MailComment = require('./mailComment.model');

const findAll = async ({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) => {
  const skip = (page - 1) * limit;
  const [mails, total] = await Promise.all([
    Mail.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('assignedDepartment', 'name')
      .populate('category', 'name maxProcessingTime')
      .populate('statusHistory.changedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Mail.countDocuments(filter),
  ]);
  return { mails, total };
};

const findById = async (id) => {
  return Mail.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role departmentId')
    .populate('assignedDepartment', 'name')
    .populate('category', 'name maxProcessingTime')
    .populate('statusHistory.changedBy', 'name email');
};

const create = async (data) => {
  return Mail.create(data);
};

const update = async (id, data) => {
  return Mail.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('assignedDepartment', 'name')
    .populate('category', 'name maxProcessingTime');
};

const remove = async (id) => {
  return Mail.findByIdAndDelete(id);
};

const findByUser = async (userId, { page = 1, limit = 10 }) => {
  const filter = {
    $or: [{ createdBy: userId }, { assignedTo: userId }],
  };
  const skip = (page - 1) * limit;
  const [mails, total] = await Promise.all([
    Mail.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Mail.countDocuments(filter),
  ]);
  return { mails, total };
};

const markOverdueMails = async () => {
  return Mail.updateMany(
    {
      slaDeadline: { $lt: new Date() },
      status: { $ne: 'Processed' },
      isOverdue: false,
    },
    { $set: { isOverdue: true } }
  );
};

const getStats = async () => {
  return Mail.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

// --- Comments ---
const addComment = async (data) => {
  return MailComment.create(data);
};

const getComments = async (mailId) => {
  return MailComment.find({ mailId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findByUser,
  markOverdueMails,
  getStats,
  addComment,
  getComments,
};
