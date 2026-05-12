const userRepository = require('./user.repository');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const getAllUsers = async (query) => {
  const { page = 1, limit = 10, role, departmentId, search, isActive } = query;
  const filter = {};

  if (role) filter.role = role;
  if (departmentId) filter.departmentId = departmentId;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  return userRepository.findAll({ filter, page: parseInt(page), limit: parseInt(limit) });
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const createUser = async (data, req) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new AppError('Email already in use', 409);

  const user = await userRepository.create(data);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'User',
    entityId: user._id,
    changes: { name: user.name, email: user.email, role: user.role },
    req,
  });

  return user;
};

const updateUser = async (id, data, req) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email already in use', 409);
  }

  const updated = await userRepository.update(id, data);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'User',
    entityId: id,
    changes: data,
    req,
  });

  return updated;
};

const deleteUser = async (id, req) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (req.user._id.toString() === id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  await userRepository.remove(id);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'User',
    entityId: id,
    changes: { deletedUser: user.email },
    req,
  });
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
