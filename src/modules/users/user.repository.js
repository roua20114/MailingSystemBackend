const User = require('./user.model');

const findAll = async ({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).populate('departmentId', 'name').sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, total };
};

const findById = async (id) => {
  return User.findById(id).populate('departmentId', 'name');
};

const findByEmail = async (email) => {
  return User.findOne({ email });
};

const create = async (data) => {
  return User.create(data);
};

const update = async (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('departmentId', 'name');
};

const remove = async (id) => {
  return User.findByIdAndDelete(id);
};

const countByRole = async (role) => {
  return User.countDocuments({ role });
};

module.exports = { findAll, findById, findByEmail, create, update, remove, countByRole };
