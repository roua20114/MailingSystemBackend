const ROLES = {
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  SECRETARY: 'Secretary',
  PROFESSOR: 'Professor',
  SERVICE_LEAD: 'Service Lead',
};

const MAIL_STATUS = {
  REGISTERED: 'Registered',
  UNDER_REVIEW: 'Under Review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  PROCESSED: 'Processed',
};

// Valid transitions map
const STATUS_TRANSITIONS = {
  [MAIL_STATUS.REGISTERED]: [MAIL_STATUS.UNDER_REVIEW],
  [MAIL_STATUS.UNDER_REVIEW]: [MAIL_STATUS.ASSIGNED],
  [MAIL_STATUS.ASSIGNED]: [MAIL_STATUS.IN_PROGRESS],
  [MAIL_STATUS.IN_PROGRESS]: [MAIL_STATUS.PROCESSED],
  [MAIL_STATUS.PROCESSED]: [],
};

const MAIL_TYPES = {
  INCOMING: 'Incoming',
  OUTGOING: 'Outgoing',
  INTERNAL: 'Internal',
};

const MAIL_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ASSIGN: 'ASSIGN',
  STATUS_CHANGE: 'STATUS_CHANGE',
};

module.exports = {
  ROLES,
  MAIL_STATUS,
  STATUS_TRANSITIONS,
  MAIL_TYPES,
  MAIL_PRIORITY,
  AUDIT_ACTIONS,
};
