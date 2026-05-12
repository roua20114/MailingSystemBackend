const departmentRepository = require('./department.repository');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const getAllDepartments = async (query = {}) => {
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  return departmentRepository.findAll(filter);
};

const getDepartmentById = async (id) => {
  const dept = await departmentRepository.findById(id);
  if (!dept) throw new AppError('Department not found', 404);
  return dept;
};

const createDepartment = async (data, req) => {
  const existing = await departmentRepository.findByName(data.name);
  if (existing) throw new AppError('Department with this name already exists', 409);

  if (data.parentId) {
    const parent = await departmentRepository.findById(data.parentId);
    if (!parent) throw new AppError('Parent department not found', 404);
  }

  const dept = await departmentRepository.create(data);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Department',
    entityId: dept._id,
    changes: { name: dept.name },
    req,
  });

  return dept;
};

const updateDepartment = async (id, data, req) => {
  const dept = await departmentRepository.findById(id);
  if (!dept) throw new AppError('Department not found', 404);

  if (data.name && data.name !== dept.name) {
    const existing = await departmentRepository.findByName(data.name);
    if (existing) throw new AppError('Department name already in use', 409);
  }

  if (data.parentId && data.parentId.toString() === id) {
    throw new AppError('A department cannot be its own parent', 400);
  }

  const updated = await departmentRepository.update(id, data);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Department',
    entityId: id,
    changes: data,
    req,
  });

  return updated;
};

const deleteDepartment = async (id, req) => {
  const dept = await departmentRepository.findById(id);
  if (!dept) throw new AppError('Department not found', 404);

  const children = await departmentRepository.findChildren(id);
  if (children.length > 0) {
    throw new AppError('Cannot delete a department that has sub-departments', 400);
  }

  await departmentRepository.remove(id);

  await createAuditLog({
    userId: req.user._id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'Department',
    entityId: id,
    changes: { deletedDept: dept.name },
    req,
  });
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
