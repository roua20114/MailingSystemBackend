const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body, req);
    sendSuccess(res, { user }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password, req);
    sendSuccess(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, tokens, 'Tokens refreshed successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id, req);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    sendSuccess(res, { user: req.user }, 'Current user retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe };
