# AGENTS.md — SE104.Q21.DoAn

## Quick start

```powershell
cd backend
cp .env.example .env        # edit DB credentials
npm install
npm run dev                 # nodemon src/server.js (port 5001)
```

Frontend: open `frontend/index.html` in a browser (no build step; SPA uses `type="module"` scripts).

## Architecture

- **Backend:** `backend/src/server.js` → routes → middlewares (auth/role/validation) → controllers → Sequelize models → MS SQL Server
- **Frontend:** `frontend/index.html` shell → `frontend/assets/js/router.js` (hash-based SPA) loads `frontend/pages/*.html` + dynamically imports `frontend/assets/js/pages/*.page.js`
- **API prefix:** public at `/api/auth`, private at `/api/school` (all other routes)
- **ES Modules throughout** (`"type": "module"` in `backend/package.json`) — use `import`/`export`, not `require`

## Key conventions

- **Model naming:** models are factory functions (`(sequelize) => sequelize.define(...)`) registered in `backend/libs/db.js:43-58`
- **All models use `freezeTableName: true`, `timestamps: false`**
- **Table names:** Vietnamese uppercase (`HOCSINH`, `LOP`, `BANGDIEMMON`, etc.)
- **PK naming:** `MaHS`, `MaLop`, `MaMonHoc`, `MaBangDiemMon` — auto-generated codes like `MH001`
- **Routes: thin** — controllers have all business logic
- **Frontend pages: each** has `init()` exported function called by router after HTML load
- **Auth:** JWT in `localStorage` as `token`; sent as `Authorization: Bearer <token>`
- **Roles:** `Admin` (read/write/delete), `Manager` (read/write), `User` (read only, redirected to search)

## Database

- MS SQL Server via `mssql` + `sequelize`; dialect set to `mssql` in `backend/libs/db.js:27`
- `backend/libs/db.js` is the single source of truth for all model associations
- On startup, `sequelize.sync()` creates/migrates tables automatically, plus creates unique indexes and report tables (`BAOCAOTONGKETMON`, `CT_BAOCAOTONGKETMON`)
- `DaKetThuc` column on `NAMHOC` is added via raw SQL in `backend/src/finalizeYear.js:7-10` (not in model)

## Notable file locations

| Purpose | Path |
|---------|------|
| Server entry | `backend/src/server.js` |
| DB + model registry | `backend/libs/db.js` |
| Role constants | `backend/src/role.js` |
| Auto year finalization | `backend/src/finalizeYear.js` |
| Joi validation | `backend/middlewares/*.validation.js` |
| Models (core) | `backend/models/` |
| Models (scores) | `backend/models/professional_requirements/` |
| SPA router | `frontend/assets/js/router.js` |
| Permission checks | `frontend/assets/js/permission.js` |
| Role config | `frontend/assets/js/config/role.js` |
| API service modules | `frontend/assets/js/service/*.service.js` |
| Page controllers | `frontend/assets/js/pages/*.page.js` |
| HTML pages | `frontend/pages/*.html` |

## Known gaps

- **No tests** in the repo (no test runner configured)
- **No linting/formatting config** (no ESLint, Prettier)
- **No CI/CD** (no GitHub Actions or similar)
- `backend/routes` vs `frontend/assets/js/service` — keep endpoint paths in sync manually
- Login page is at `/frontend/pages/login.html`, not through the SPA router — redirects to `../index.html` on success

## Complex hotspots — proceed with care

- `backend/src/controllers/studyProcess.controller.js` (~890 lines) — enrollment, transfer (with score migration), batch assign, promote
- `frontend/assets/js/pages/scores.page.js` (~1550 lines) — interactive score table, real-time GPA, Excel import/export
- `frontend/assets/js/pages/class-assignment.page.js` (~980 lines) — dual-panel UI, batch ops, promote workflow
