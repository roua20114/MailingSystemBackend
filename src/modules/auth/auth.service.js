const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../users/user.model');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const { AUDIT_ACTIONS } = require('../../utils/constants');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

const register = async (userData, req) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const user = await User.create(userData);

  await createAuditLog({
    userId: user._id,
    userEmail: user.email,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'User',
    entityId: user._id,
    changes: { name: user.name, email: user.email, role: user.role },
    req,
  });

  return user;
};

const login = async (email, password, req) => {
  const user = await User.findOne({ email }).select('+password').populate('departmentId', 'name');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 401);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await createAuditLog({
    userId: user._id,
    userEmail: user.email,
    action: AUDIT_ACTIONS.LOGIN,
    entity: 'User',
    entityId: user._id,
    req,
  });

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, req) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      userId: user._id,
      userEmail: user.email,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: 'User',
      entityId: user._id,
      req,
    });
  }
};

module.exports = { register, login, refreshAccessToken, logout };
