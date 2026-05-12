const Department = require('./department.model');

const findAll = async (filter = {}) => {
  return Department.find(filter)
    .populate('parentId', 'name')
    .populate('headUserId', 'name email role')
    .sort({ name: 1 });
};

const findById = async (id) => {
  return Department.findById(id)
    .populate('parentId', 'name')
    .populate('headUserId', 'name email role');
};

const findByName = async (name) => {
  return Department.findOne({ name });
};

const create = async (data) => {
  return Department.create(data);
};

const update = async (id, data) => {
  return Department.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('parentId', 'name')
    .populate('headUserId', 'name email role');
};

const remove = async (id) => {
  return Department.findByIdAndDelete(id);
};

const findChildren = async (parentId) => {
  return Department.find({ parentId });
};

module.exports = { findAll, findById, findByName, create, update, remove, findChildren };
