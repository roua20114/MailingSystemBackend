const userService = require('./user.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

const getAllUsers = async (req, res, next) => {
  try {
    const { users, total } = await userService.getAllUsers(req.query);
    const { page = 1, limit = 10 } = req.query;
    sendPaginated(res, users, total, page, limit, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, { user }, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req);
    sendSuccess(res, { user }, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req);
    sendSuccess(res, { user }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req);
    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
