<<<<<<< HEAD
# Backend_assignment02
=======
# ⚡ TaskFlow API

A **production-grade, scalable REST API** built with Node.js, Express, and MongoDB featuring JWT Authentication, Role-Based Access Control (RBAC), full CRUD operations, and a React frontend dashboard.

---

## 📋 Features

### Backend
- ✅ **JWT Authentication** — Login, register, refresh tokens, secure logout
- ✅ **Role-Based Access Control** — `user` and `admin` roles with middleware-enforced guards
- ✅ **Task CRUD** — Full create/read/update/delete with filtering, pagination, sorting
- ✅ **API Versioning** — All routes under `/api/v1/`
- ✅ **Input Validation** — express-validator on every endpoint
- ✅ **Security** — Helmet, CORS, rate limiting, XSS sanitization, NoSQL injection prevention
- ✅ **Error Handling** — Centralized error handler with operational vs programming error distinction
- ✅ **Logging** — Winston logger with file rotation
- ✅ **Swagger UI** — Interactive API documentation at `/api-docs`
- ✅ **Docker Ready** — Multi-stage Dockerfile + docker-compose

### Frontend
- ✅ **React + React Router** — SPA with protected routes
- ✅ **JWT Management** — Automatic token refresh via Axios interceptors
- ✅ **Dashboard** — Task stats and progress overview
- ✅ **Task Manager** — Create, edit, delete, filter, paginate tasks
- ✅ **Admin Panel** — Manage users, change roles, activate/deactivate
- ✅ **Profile Page** — Update name, change password
- ✅ **Toast Notifications** — Success/error feedback from every API call

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/taskflow-api.git
cd taskflow-api
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

The backend runs on **http://localhost:5000** and frontend on **http://localhost:3000**.

---

## 🐳 Docker Deployment

```bash
# Start all services (MongoDB + Redis + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api-docs
- MongoDB: localhost:27017

---

## 📖 API Documentation

Interactive Swagger UI: **http://localhost:5000/api-docs**

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout and invalidate token | Yes |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/update-password` | Change password | Yes |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks` | Get tasks (filtered, paginated) | Yes |
| POST | `/tasks` | Create new task | Yes |
| GET | `/tasks/stats` | Get task statistics | Yes |
| GET | `/tasks/:id` | Get single task | Yes |
| PUT | `/tasks/:id` | Update task | Yes |
| DELETE | `/tasks/:id` | Delete task | Yes |
| PATCH | `/tasks/:id/archive` | Toggle archive | Yes |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/profile` | Get own profile | Yes |
| PUT | `/users/profile` | Update profile | Yes |
| DELETE | `/users/profile` | Deactivate account | Yes |

### Admin (Admin Role Required)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Platform statistics | Admin |
| GET | `/admin/users` | List all users | Admin |
| GET | `/admin/users/:id` | Get user detail | Admin |
| PATCH | `/admin/users/:id` | Update user role/status | Admin |
| DELETE | `/admin/users/:id` | Delete user | Admin |

---

## 🗄️ Database Schema

### User
```js
{
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (hashed with bcrypt, salts=12),
  role: enum['user', 'admin'] (default: 'user'),
  isActive: Boolean (default: true),
  refreshToken: String (hashed UUID, select: false),
  refreshTokenExpiry: Date,
  lastLogin: Date,
  passwordChangedAt: Date,
  avatarInitials: String,
  timestamps: true
}
```

### Task
```js
{
  title: String (required, 3-100 chars),
  description: String (max 500 chars),
  status: enum['todo', 'in-progress', 'completed'],
  priority: enum['low', 'medium', 'high'],
  dueDate: Date (must be future),
  tags: [String] (max 10),
  owner: ObjectId -> User (required),
  isArchived: Boolean (default: false),
  timestamps: true
}
```

### Indexes
- User: `email (unique)`, `role`, `createdAt`
- Task: `owner + status`, `owner + priority`, `owner + createdAt`, `text (title + description)`

---

## 🔒 Security Measures

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with salt rounds = 12 |
| JWT | HS256 signed, expiry 7d, refresh token 30d |
| Rate Limiting | 100 req/15min general, 20 req/15min auth |
| NoSQL Injection | express-mongo-sanitize |
| XSS Prevention | xss-clean middleware |
| Security Headers | Helmet.js |
| Input Validation | express-validator on all inputs |
| CORS | Configured origin whitelist |
| Body Limit | 10KB request body limit |
| Error Sanitization | Never expose stack traces in production |

---

## 📁 Project Structure

```
taskflow-api/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection with pooling
│   │   │   └── swagger.js           # Swagger/OpenAPI config
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # Register, login, refresh, logout
│   │   │   ├── task.controller.js   # Full CRUD + stats
│   │   │   ├── user.controller.js   # Profile management
│   │   │   └── admin.controller.js  # Admin user management
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT protect + restrictTo()
│   │   │   ├── validate.middleware.js # Input validators
│   │   │   └── errorHandler.js      # Global error handling
│   │   ├── models/
│   │   │   ├── User.model.js        # User schema + methods
│   │   │   └── Task.model.js        # Task schema + virtuals
│   │   ├── routes/v1/
│   │   │   ├── auth.routes.js
│   │   │   ├── task.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── admin.routes.js
│   │   ├── utils/
│   │   │   ├── logger.js            # Winston logger
│   │   │   └── apiHelpers.js        # AppError + response helpers
│   │   └── index.js                 # Express app entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx  # Global auth state
│   │   ├── utils/api.js             # Axios instance + interceptors
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── LoadingScreen.jsx
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── SCALABILITY.md
└── README.md
```

---

## 🧪 Sample API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Secure@123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Secure@123"}'
```

### Create Task (authenticated)
```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Build REST API","priority":"high","tags":["backend"]}'
```

---

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your_secret_key` |
| `JWT_EXPIRE` | Access token expiry | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your_refresh_secret` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `REDIS_URL` | Redis URL (optional) | `redis://localhost:6379` |

---

## 📊 Response Format

All responses follow a consistent format:

```json
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "pagination": { ... } }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

👨‍💻 Author

Harshit Shukla
Backend Developer | Full Stack Enthusiast
Final Year B.Tech Student
