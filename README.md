# NexusMail — Institutional Mail Management System

A production-ready Node.js/Express/MongoDB backend for managing institutional mail with strict role-based access control and an enforced workflow pipeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (Access + Refresh tokens) |
| Validation | Joi |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, Rate Limiting |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

---

## Seeded Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexusmail.com | Admin@123456 |
| Director | director@nexusmail.com | Director@123 |
| Secretary | secretary@nexusmail.com | Secretary@123 |
| Professor | professor@nexusmail.com | Professor@123 |
| Service Lead | servicelead@nexusmail.com | ServiceLead@123 |

---

## Role Hierarchy & Permissions

```
Admin > Director > Service Lead > Secretary / Professor
```

| Action | Admin | Director | Secretary | Professor | Service Lead |
|---|:---:|:---:|:---:|:---:|:---:|
| Register mail | ✅ | ❌ | ✅ | ❌ | ❌ |
| Move to Under Review | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign mail | ✅ | ✅ | ❌ | ❌ | ❌ |
| Start In Progress | ✅ | ✅ | ❌ | ✅ (own) | ✅ (own) |
| Mark Processed | ✅ | ✅ | ❌ | ✅ (own) | ✅ (own) |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage departments | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update system config | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Mail Workflow

```
[Secretary] Registers Mail
        ↓
   status: Registered
        ↓
[Director] Reviews
        ↓
   status: Under Review
        ↓
[Director] Assigns + Instructions (MANDATORY)
        ↓
   status: Assigned
        ↓
[Assignee] Starts work
        ↓
   status: In Progress
        ↓
[Assignee] Completes
        ↓
   status: Processed ✅
```

**Invalid transitions are rejected with a descriptive error.**

---

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/refresh | Public | Refresh tokens |
| POST | /api/auth/logout | JWT | Logout |
| GET | /api/auth/me | JWT | Get current user |

### Users (Admin only)
| Method | Path | Description |
|---|---|---|
| GET | /api/users | List users (paginated) |
| POST | /api/users | Create user |
| GET | /api/users/:id | Get user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Departments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/departments | JWT | List departments |
| POST | /api/departments | Admin | Create department |
| GET | /api/departments/:id | JWT | Get department |
| PUT | /api/departments/:id | Admin | Update department |
| DELETE | /api/departments/:id | Admin | Delete department |

### Mail
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/mails | JWT | List mails (filtered) |
| POST | /api/mails | Secretary/Admin | Register new mail |
| GET | /api/mails/stats | Director/Admin | Stats by status |
| GET | /api/mails/:id | JWT | Get mail details |
| PUT | /api/mails/:id/status | JWT | Update status (validated) |
| PUT | /api/mails/:id/assign | Director/Admin | Assign mail |
| GET | /api/mails/user/:id | Admin/Director/SL | Get user's mails |

### Comments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/mails/:id/comments | JWT | Add comment |
| GET | /api/mails/:id/comments | JWT | Get comments |

### Settings
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/mail-types | JWT | List mail types |
| POST | /api/mail-types | Admin | Create mail type |
| PUT | /api/mail-types/:id | Admin | Update mail type |
| DELETE | /api/mail-types/:id | Admin | Delete mail type |
| GET | /api/mail-categories | JWT | List categories |
| POST | /api/mail-categories | Admin | Create category |
| PUT | /api/mail-categories/:id | Admin | Update category |
| DELETE | /api/mail-categories/:id | Admin | Delete category |
| GET | /api/config | JWT | Get system config |
| PUT | /api/config | Admin | Update system config |
| GET | /api/audit-logs | Admin | View audit trail |

---

## Project Structure

```
nexusmail/
├── src/
│   ├── app.js                    # Express app, middleware, routes
│   ├── server.js                 # HTTP server + graceful shutdown
│   ├── config/
│   │   └── index.js              # Centralized env config
│   ├── database/
│   │   ├── connection.js         # MongoDB connection
│   │   └── seed.js               # Database seeder
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── role.middleware.js    # RBAC enforcement
│   │   ├── validate.middleware.js# Joi schema runner
│   │   ├── audit.middleware.js   # Audit log helper
│   │   └── error.middleware.js   # Global error handler
│   ├── utils/
│   │   ├── AppError.js           # Custom error class
│   │   ├── constants.js          # Roles, statuses, transitions
│   │   ├── logger.js             # Winston logger
│   │   └── response.js           # Standard response helpers
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js
│       │   ├── auth.service.js
│       │   ├── auth.routes.js
│       │   └── auth.validation.js
│       ├── users/
│       │   ├── user.model.js
│       │   ├── user.controller.js
│       │   ├── user.service.js
│       │   ├── user.repository.js
│       │   ├── user.routes.js
│       │   └── user.validation.js
│       ├── departments/
│       │   ├── department.model.js
│       │   ├── department.controller.js
│       │   ├── department.service.js
│       │   ├── department.repository.js
│       │   ├── department.routes.js
│       │   └── department.validation.js
│       ├── mail/
│       │   ├── mail.model.js
│       │   ├── mailComment.model.js
│       │   ├── mail.controller.js
│       │   ├── mail.service.js
│       │   ├── mail.repository.js
│       │   ├── mail.routes.js
│       │   ├── mail.validation.js
│       │   └── ai.service.js     # Mock AI pipeline
│       └── settings/
│           ├── mailType.model.js
│           ├── mailCategory.model.js
│           ├── systemConfig.model.js
│           ├── auditLog.model.js
│           ├── settings.controller.js
│           ├── settings.service.js
│           ├── settings.repository.js
│           ├── settings.routes.js
│           └── settings.validation.js
├── swagger.yaml                  # OpenAPI 3.0 documentation
├── .env.example
├── .gitignore
└── package.json
```

---

## AI Features (Simulated)

When a mail is created, the AI pipeline automatically:

1. **OCR Metadata Extraction** — detects priority from keywords (urgent, high, low, etc.) and counts words
2. **Summary Generation** — produces a 2-sentence contextual summary from subject and sender
3. **Department Suggestion** — maps keywords to departments with a 0–1 confidence score
4. **SLA Deadline Calculation** — sets deadline using `MailCategory.maxProcessingTime` (falls back to `SystemConfig.globalTimeout`)

> To use real AI, replace `src/modules/mail/ai.service.js` with calls to OpenAI, AWS Textract, or any ML service.

---

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email" }
  ]
}
```

HTTP status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`

---

## API Documentation

The full OpenAPI 3.0 spec is at `swagger.yaml`.  
To view it interactively, paste the contents into [editor.swagger.io](https://editor.swagger.io).

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/nexusmail` |
| `JWT_ACCESS_SECRET` | Access token signing key | — |
| `JWT_REFRESH_SECRET` | Refresh token signing key | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
