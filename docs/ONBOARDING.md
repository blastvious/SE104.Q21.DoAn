# Onboarding Guide: SE104.Q21.DoAn

## Project Overview

A **student management system** built with Node.js and Express that digitizes administrative and academic processes for educational institutions — student information management, class management, grade tracking, and academic reporting.

| Attribute | Value |
|-----------|-------|
| **Name** | SE104.Q21.DoAn |
| **Languages** | JavaScript, HTML, CSS, JSON, Markdown |
| **Frameworks** | Express, Sequelize, bcrypt, jsonwebtoken, cors, joi, helmet, mssql |
| **Tools** | nodemon, dotenv |
| **DB** | SQL Server via `mssql` + Sequelize ORM |

---

## Architecture Layers

### 1. API Layer
Express route definitions and their corresponding controller handlers, plus the server entry point that wires them together.

| File | Summary |
|------|---------|
| `backend/src/server.js` | Express entry point — configures middleware, mounts all route modules, starts listening |
| `backend/routes/auth.Route.js` | Auth & user management endpoints (register, login, CRUD) |
| `backend/routes/student.Route.js` | Student CRUD endpoints |
| `backend/routes/class.router.js` | Academic year, semester, grade & class CRUD endpoints |
| `backend/routes/score.router.js` | Score operations & recalculation endpoints |
| `backend/routes/studyProcess.router.js` | Enrollment, transfer & summary endpoints |
| `backend/routes/academic.router.js` | Subjects & exam types endpoints |
| `backend/routes/dashboard.router.js` | Dashboard statistics endpoint |
| `backend/routes/parameter.router.js` | Parameter management endpoints |
| `backend/routes/reportSemester.router.js` | Semester report endpoints |
| `backend/routes/reportSubjects.router.js` | Subject report endpoints |
| `backend/routes/search.router.js` | Student search endpoints |
| `backend/src/controllers/auth.controller.js` | Auth CRUD — login, JWT, user management |
| `backend/src/controllers/student.Controller.js` | Student CRUD operations |
| `backend/src/controllers/class.controller.js` | Year/semester/grade/class CRUD |
| `backend/src/controllers/score.controller.js` | Score entry, bulk import, GPA recalculation |
| `backend/src/controllers/studyProcess.controller.js` | Enrollment, transfer, semester summary, promotion |
| `backend/src/controllers/academic.controller.js` | Subject & exam type CRUD |
| `backend/src/controllers/dashboard.controller.js` | Pass rate statistics |
| `backend/src/controllers/parameter.controller.js` | Parameter operations |
| `backend/src/controllers/reportSemester.controller.js` | Semester report logic |
| `backend/src/controllers/reportSubjects.controller.js` | Subject summary reports |
| `backend/src/controllers/search.controller.js` | Student search, suggestions, history, scores |

### 2. Data Access Layer
Sequelize model definitions and the shared database connection module.

| File | Summary |
|------|---------|
| `backend/libs/db.js` | Sequelize connection to SQL Server, imports & registers all models |
| `backend/models/student.Models.js` | Student entity model |
| `backend/models/User.Models.js` | User entity model |
| `backend/models/Class.models.js` | Class entity model |
| `backend/models/Grade.models.js` | Grade entity model |
| `backend/models/Semester.models.js` | Semester entity model |
| `backend/models/Subject.models.js` | Subject entity model |
| `backend/models/TypeTest.models.js` | Exam type entity model |
| `backend/models/Year.models.js` | Academic year entity model |
| `backend/models/professional_requirements/Score.models.js` | Score entity model |
| `backend/models/professional_requirements/ScoreDetail.models.js` | Score detail entity model |
| `backend/models/professional_requirements/StudyProcess.models.js` | Study process entity model |
| `backend/models/professional_requirements/TypeTestDetail.models.js` | Exam type detail entity model |

### 3. Middleware Layer
Express middleware for authentication (JWT), role-based access control, and request payload validation.

| File | Summary |
|------|---------|
| `backend/middlewares/auth.middleware.js` | JWT auth — verifies Bearer tokens, attaches decoded user + role to request |
| `backend/middlewares/role.validation.js` | Role-based authorization — checks user role against permitted actions |
| `backend/middlewares/student.validation.js` | Joi validation schemas for student payloads |
| `backend/middlewares/studyProcess.validation.js` | Joi validation for enrollment, transfer, summary |
| `backend/middlewares/user.validation.js` | Joi validation for user payloads |

### 4. Backend Support Layer
Utility modules supporting backend operations.

| File | Summary |
|------|---------|
| `backend/src/role.js` | Role constants — Admin, Manager, User with permitted actions |
| `backend/src/finalizeYear.js` | Scheduled task for auto-finalizing academic years |
| `config:backend/package.json` | Backend npm package configuration |

### 5. Frontend Pages
HTML views — one per feature, loaded dynamically by the SPA router.

| Page | File |
|------|------|
| Login | `frontend/pages/login.html` |
| Dashboard | `frontend/pages/dashboard.html` |
| Students | `frontend/pages/students.html` |
| Scores | `frontend/pages/scores.html` |
| Class Assignment | `frontend/pages/class-assignment.html` |
| Subjects | `frontend/pages/subjects.html` |
| Exam Types | `frontend/pages/examtype.html` |
| Regulations | `frontend/pages/regulations.html` |
| Reports (Semester) | `frontend/pages/report-semester.html` |
| Reports (Subjects) | `frontend/pages/report-subjects.html` |
| Search | `frontend/pages/search.html` |
| Settings | `frontend/pages/settings.html` |
| Account | `frontend/pages/account.html` |
| Root | `frontend/index.html` |

### 6. Frontend Controllers
Client-side JavaScript — page controllers, API service modules, SPA router, permission checks, and toast notifications.

| File | Summary |
|------|---------|
| `frontend/assets/js/router.js` | SPA router — loads pages dynamically, checks permissions, manages navigation |
| `frontend/assets/js/permission.js` | Permission checks — `canAccessPage`, `can` functions against role definitions |
| `frontend/assets/js/config/role.js` | Role definitions — Admin, Manager, User with page/permission mappings |
| `frontend/assets/js/toast.js` | Toast notification utility |
| `frontend/assets/js/service/auth.service.js` | Auth API calls (login, register, etc.) |
| `frontend/assets/js/service/student.service.js` | Student API calls |
| `frontend/assets/js/service/subject.service.js` | Subject API calls |
| `frontend/assets/js/service/settings.service.js` | Settings API calls (years, semesters, grades, classes) |
| `frontend/assets/js/service/studyProcess.service.js` | Study process API calls |
| `frontend/assets/js/service/examtype.service.js` | Exam type API calls |
| `frontend/assets/js/service/parameter.service.js` | Parameter API calls |
| `frontend/assets/js/pages/*.page.js` | Per-page controllers handling DOM events and calling services |

### 7. Frontend Styles
CSS stylesheets for layout, theme, and per-page styling.

| File | Purpose |
|------|---------|
| `frontend/assets/css/reset.css` | CSS reset / normalize |
| `frontend/assets/css/layout.css` | Overall application layout |
| `frontend/assets/css/style.css` | Main stylesheet — core styles |
| `frontend/assets/css/*.css` | Per-feature stylesheets (dashboard, students, scores, etc.) |
| `frontend/assets/css/toast.css` | Toast notification styles |

### 8. Configuration
| File | Purpose |
|------|---------|
| `package.json` | Root npm manifest |
| `.gitattributes` | Git attribute configuration |

### 9. Documentation
| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `TASK.md` | Task specification |

### 10. Internal Tooling
| File | Purpose |
|------|---------|
| `.understand-anything/.understandignore` | Codebase analysis ignore rules |

---

## Key Concepts

### Authentication & Authorization
- **JWT-based auth**: `auth.middleware.js` verifies Bearer tokens; decoded user (including role) is attached to the request
- **Three roles**: `Admin`, `Manager`, `User` — defined in `backend/src/role.js` with granular read/write/delete permissions
- **Role enforcement on frontend**: `frontend/assets/js/config/role.js` defines page/permission mappings; `permission.js` exports `canAccessPage()` and `can()`; the SPA router checks these before loading any page

### Request Flow
```
Browser → Route Handler → Middleware (auth + role + validation) → Controller → Sequelize Model → SQL Server
```

### Architecture Pattern
- **Backend**: Thin routes → Middleware chain → Fat controllers → Sequelize models
- **Frontend**: SPA with hash-based routing → Page controllers → Service modules (fetch API) → Backend REST endpoints
- Routes delegate all logic to controllers; controllers use models via Sequelize

### Database
- SQL Server via `mssql` driver
- Sequelize ORM for model definitions and querying
- `backend/libs/db.js` is the central connection hub, imported by every controller and model

### Study Process Domain
A core domain feature encompassing enrollment, class transfer, batch student assignment, semester summary computation, and student promotion across academic years. The most complex controller in the system.

---

## Guided Tour

### Step 1: Project Overview — README
Start with `README.md` to understand the project's purpose and context.

### Step 2: Server Entry Point & Request Flow
Examine `backend/src/server.js` — the Express server that initializes middleware, connects to the database, mounts all routes, and starts listening. This is the central wiring hub.

### Step 3: API Routes — Endpoint Definitions
Explore the route files that map HTTP methods/paths to controller functions. Routes are thin — they delegate all logic to controllers. Key files: `auth.Route.js`, `student.Route.js`, `class.router.js`, `score.router.js`, `studyProcess.router.js`.

### Step 4: Middleware — Authentication & Validation
Study JWT auth (`auth.middleware.js`), role-based access control (`role.validation.js`), and Joi validation schemas. These protect every API endpoint.

### Step 5: Controllers — Authentication & User Management
Dive into `auth.controller.js` — login, user CRUD, JWT token generation via bcrypt.

### Step 6: Controllers — Core Domain Business Logic
Explore the primary feature controllers: `student.Controller.js`, `class.controller.js`, `score.controller.js`, `studyProcess.controller.js`.

### Step 7: Data Layer — Database Connection & Sequelize Models
Understand `backend/libs/db.js` and the model files: Student, Class, Grade, Semester, Subject, Score, StudyProcess.

### Step 8: Frontend — HTML Pages & Client-Side Routing
See how the frontend works as an SPA. `index.html` loads all scripts including the custom router. `router.js` intercepts hash-based navigation.

### Step 9: Frontend — Controllers, Services & Permissions
Examine page controllers (`.page.js`), service modules (`.service.js`), permission checks, and role config.

### Step 10: Backend Support, Configuration & Documentation
Review role constants, year-finalization logic, package configs, Git attributes, and TASK.md.

---

## Complexity Hotspots

**Approach these areas carefully — they have the highest complexity ratings:**

| File | Lines | Complexity |
|------|-------|------------|
| `backend/src/controllers/studyProcess.controller.js` | 789 | complex |
| `frontend/assets/js/pages/class-assignment.page.js` | 649 | complex |
| `backend/src/controllers/class.controller.js` | 481 | complex |
| `frontend/assets/js/pages/report-subjects.page.js` | 454 | complex |
| `frontend/assets/js/pages/report-semester.page.js` | 404 | complex |
| `frontend/assets/js/pages/scores.page.js` | 390 | complex |
| `backend/src/controllers/search.controller.js` | 360 | complex |
| `frontend/assets/js/pages/settings.page.js` | 324 | complex |
| `backend/src/controllers/parameter.controller.js` | 201 | complex |
| `frontend/assets/js/pages/student.page.js` | 203 | complex |

---

## Quick Reference

### Backend Dependencies
express, sequelize, bcrypt, jsonwebtoken, cors, joi, helmet, mssql, nodemon, dotenv

### Entry Points
- **Server**: `backend/src/server.js`
- **Frontend**: `frontend/index.html`

### Database Connection
`backend/libs/db.js` — Sequelize instance connected to SQL Server, importing all model files

### Authentication Flow
Login → JWT issued → Stored in localStorage → Sent as Bearer token → Verified by `auth.middleware.js`
