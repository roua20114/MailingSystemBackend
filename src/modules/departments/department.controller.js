const deptService = require('./department.service');
const { sendSuccess } = require('../../utils/response');

const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await deptService.getAllDepartments(req.query);
    sendSuccess(res, { departments }, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await deptService.getDepartmentById(req.params.id);
    sendSuccess(res, { department }, 'Department retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const department = await deptService.createDepartment(req.body, req);
    sendSuccess(res, { department }, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const department = await deptService.updateDepartment(req.params.id, req.body, req);
    sendSuccess(res, { department }, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    await deptService.deleteDepartment(req.params.id, req);
    sendSuccess(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
