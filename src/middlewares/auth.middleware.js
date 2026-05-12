const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../modules/users/user.model');
const AppError = require('../utils/AppError');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access token is required', 401));
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token has expired', 401));
      }
      return next(new AppError('Invalid access token', 401));
    }

    const user = await User.findById(decoded.id).populate('departmentId', 'name');

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
