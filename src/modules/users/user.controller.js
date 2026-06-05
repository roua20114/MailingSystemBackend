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

// ── Notification Preferences ──────────────────────────────────────────────────

/**
 * GET /api/users/notification-settings
 * Retourne les préférences de notifications de l'utilisateur connecté.
 */
const getNotificationSettings = async (req, res, next) => {
  try {
    const User = require('./user.model');
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Retourne les prefs (avec valeurs par défaut si le champ est vide)
    const preferences = user.notificationPreferences ?? {
      assignedMail:  { inApp: true,  email: true  },
      slaAlert:      { inApp: true,  email: true  },
      statusUpdates: { inApp: true,  email: false },
    };

    sendSuccess(res, { preferences }, 'Notification settings retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/notification-settings
 * Met à jour partiellement les préférences de l'utilisateur connecté.
 * Body attendu (partiel) : { assignedMail: { email: false }, slaAlert: { inApp: true } }
 */
const updateNotificationSettings = async (req, res, next) => {
  try {
    const User = require('./user.model');
    const allowed = ['assignedMail', 'slaAlert', 'statusUpdates'];
    const channels = ['inApp', 'email'];

    // Construit les champs $set de façon sécurisée (pas d'injection de clés arbitraires)
    const setFields = {};
    for (const eventKey of allowed) {
      if (req.body[eventKey] && typeof req.body[eventKey] === 'object') {
        for (const channel of channels) {
          if (typeof req.body[eventKey][channel] === 'boolean') {
            setFields[`notificationPreferences.${eventKey}.${channel}`] = req.body[eventKey][channel];
          }
        }
      }
    }

    if (Object.keys(setFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: setFields },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    sendSuccess(res, { preferences: user.notificationPreferences }, 'Notification settings updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getNotificationSettings,
  updateNotificationSettings,
};