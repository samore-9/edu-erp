# 🎓 College ERP System

A production-ready, full-stack College ERP System built with Node.js + Express + MongoDB + React.

---

## 📁 Project Structure

```
college-erp/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Login, register, me
│   │   ├── studentController.js     # Student CRUD
│   │   ├── attendanceController.js  # Mark & view attendance
│   │   ├── feesController.js        # Fee records & payments
│   │   ├── timetableController.js   # Schedule management
│   │   ├── libraryController.js     # Book issue & return
│   │   ├── tasksController.js       # Assignment management
│   │   └── dashboardController.js   # Analytics aggregations
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + role authorize
│   │   ├── errorHandler.js          # Global error handler
│   │   └── validate.js              # express-validator runner
│   ├── models/
│   │   ├── User.js                  # Role-based user (teacher/student)
│   │   ├── Student.js               # Student academic profile
│   │   ├── Attendance.js            # Attendance records + aggregations
│   │   ├── Fees.js                  # Fee records with payment history
│   │   ├── Timetable.js             # Weekly schedule per class
│   │   ├── Library.js               # Book issue/return + fine calc
│   │   └── Task.js                  # Assignments + submissions
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── attendance.routes.js
│   │   ├── fees.routes.js
│   │   ├── timetable.routes.js
│   │   ├── library.routes.js
│   │   ├── tasks.routes.js
│   │   └── dashboard.routes.js
│   ├── utils/
│   │   └── seeder.js                # Demo data seeder
│   ├── server.js                    # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js       # Global auth state + JWT
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── teacher/
    │   │   │   ├── TeacherDashboard.js
    │   │   │   ├── StudentsPage.js
    │   │   │   ├── AttendancePage.js
    │   │   │   ├── FeesPage.js
    │   │   │   ├── TimetablePage.js
    │   │   │   ├── LibraryPage.js
    │   │   │   └── TasksPage.js
    │   │   └── student/
    │   │       ├── StudentDashboard.js
    │   │       ├── StudentProfilePage.js
    │   │       ├── StudentAttendancePage.js
    │   │       ├── StudentFeesPage.js
    │   │       ├── StudentTimetablePage.js
    │   │       ├── StudentLibraryPage.js
    │   │       └── StudentTasksPage.js
    │   ├── components/
    │   │   └── common/
    │   │       └── Layout.js        # Sidebar + Navbar + Outlet
    │   ├── utils/
    │   │   └── api.js               # Axios instance with JWT interceptor
    │   ├── App.js                   # Routes + PrivateRoute guard
    │   ├── App.css                  # Full design system (CSS vars, components)
    │   └── index.js
    └── package.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Clone & Setup

```bash
git clone <repo-url>
cd college-erp
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

# Start development server
npm run dev
# API runs at http://localhost:5000
```

**`.env` values:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college_erp
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
```

---

### 3. Seed Demo Data

```bash
# From the backend/ directory
npm run seed
```

This creates:
- **Teacher:** `teacher@college.edu` / `teacher123`
- **Student:** `priya@student.edu` / `student123`
- Sample attendance, fees, tasks, and timetable

---

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start React dev server
npm start
# App runs at http://localhost:3000
```

The React app proxies `/api/*` requests to `http://localhost:5000` automatically.

---

## 🔐 API Endpoints Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login + get JWT |
| GET | `/api/auth/me` | Private | Current user |
| PUT | `/api/auth/change-password` | Private | Change password |

### Students
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/students` | Teacher | List all students |
| POST | `/api/students` | Teacher | Create student |
| GET | `/api/students/me` | Student | Own profile |
| GET | `/api/students/:id` | Both | Single student |
| PUT | `/api/students/:id` | Teacher | Update student |
| DELETE | `/api/students/:id` | Teacher | Remove student |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/attendance` | Teacher | Mark single |
| POST | `/api/attendance/bulk` | Teacher | Mark entire class |
| GET | `/api/attendance/student/:id` | Both | Student records |
| GET | `/api/attendance/report` | Teacher | Class report |
| PUT | `/api/attendance/:id` | Teacher | Update record |

### Fees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/fees` | Teacher | All fee records |
| POST | `/api/fees` | Teacher | Create fee |
| GET | `/api/fees/stats` | Teacher | Aggregated stats |
| GET | `/api/fees/student/:id` | Both | Student fees |
| POST | `/api/fees/:id/pay` | Teacher | Record payment |
| PUT | `/api/fees/:id/waiver` | Teacher | Apply waiver |

### Timetable
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/timetable` | Both | Get by dept/sem |
| POST | `/api/timetable` | Teacher | Create |
| GET | `/api/timetable/all` | Teacher | List all |
| PUT | `/api/timetable/:id` | Teacher | Update |
| DELETE | `/api/timetable/:id` | Teacher | Delete |

### Library
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/library` | Teacher | All records |
| POST | `/api/library` | Teacher | Issue book |
| GET | `/api/library/student/:id` | Both | Student history |
| PUT | `/api/library/:id/return` | Teacher | Return book |
| PUT | `/api/library/:id` | Teacher | Update record |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Both | All tasks |
| POST | `/api/tasks` | Teacher | Create task |
| GET | `/api/tasks/my` | Student | My tasks |
| GET | `/api/tasks/:id` | Both | Task detail |
| PUT | `/api/tasks/:id` | Teacher | Update |
| DELETE | `/api/tasks/:id` | Teacher | Delete |
| POST | `/api/tasks/:id/submit` | Student | Submit |
| POST | `/api/tasks/:id/grade` | Teacher | Grade submission |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/teacher` | Teacher | Analytics overview |
| GET | `/api/dashboard/student` | Student | Personal summary |

---

## 🔒 Security Features

- JWT tokens with expiry (7d default)
- Bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req / 15 min)
- CORS restricted to frontend origin
- Role-based route protection
- Students can only access their own data
- Input validation with express-validator
- Global error handling (no stack leaks in production)

---

## 🎨 Design System

The UI uses a custom design system defined in `App.css`:

- **Colors:** Primary navy (`#1a3a5c`), Accent gold (`#e8a020`), semantic greens/reds
- **Typography:** Sora (UI) + IBM Plex Mono (codes/IDs)
- **Components:** `.erp-card`, `.stat-card`, `.erp-table`, `.erp-input`, `.status-badge`
- **Layout:** Fixed sidebar (250px) + fixed navbar (64px) + scrollable main
- **Responsive:** Sidebar collapses on mobile

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MongoDB + Mongoose 8.x |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | React 18 + React Router 6 |
| UI | Bootstrap 5 + Bootstrap Icons |
| Charts | Recharts |
| HTTP | Axios |
| Security | Helmet, express-rate-limit |
| Validation | express-validator |

---

## 📝 Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@college.edu | teacher123 |
| Student | priya@student.edu | student123 |
| Student | rahul@student.edu | student123 |
| Student | anjali@student.edu | student123 |

> ⚠️ Change all passwords before deploying to production.
