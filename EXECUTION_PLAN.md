# DevCommand: Execution & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy DevCommand, a cross-platform personal project command center with GitHub auto-ingestion, AI auto-triage and feature recommendations (OpenRouter &rarr; Gemini &rarr; NVIDIA), prioritized feature backlogs, progress tracking, and future project incubator across a FastAPI backend, Next.js web client, and Flutter Android mobile app.

**Architecture:** Monorepo containing a Python FastAPI backend with SQLModel/SQLAlchemy ORM (SQLite locally, PostgreSQL in cloud), a Next.js 14+ web dashboard, and a Flutter mobile application for Android.

**Tech Stack:**
- **Backend:** Python 3.11+, FastAPI, SQLModel/SQLAlchemy, Alembic, Pydantic v2, Pytest, PyJWT, Cryptography (Fernet/AES-256), httpx
- **AI Cascade:** OpenRouter API (Free models) &rarr; Google Gemini API (`gemini-2.5-flash`) &rarr; NVIDIA NIM API
- **Web Client:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Axios/Ky, Zustand
- **Mobile Client:** Flutter 3.x, Dart, Riverpod / Provider, Dio, Flutter Secure Storage
- **Infrastructure:** Docker, Docker Compose, PostgreSQL

## Global Constraints
- Python backend must support both SQLite (`sqlite:///./devcommand.db`) for immediate zero-config local testing and PostgreSQL for cloud deployment via `DATABASE_URL`.
- User GitHub tokens must never be logged or returned in plain text over APIs (encrypted at rest via `cryptography.fernet`).
- All endpoints except public auth (`/login`, `/register`, `/github/callback`) must enforce JWT authentication and filter data by `user_id`.
- AI service must gracefully handle API outages/rate limits by cascading: OpenRouter &rarr; Gemini &rarr; NVIDIA without failing the user request.
- Every task must end with an automated test or verification command.

---

## Phase 1: Workspace & Monorepo Foundation

### Task 1.1: Initialize Monorepo Structure & Environment Scaffolding
**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `README.md`

- [ ] **Step 1: Create top-level `.gitignore`**
  Add standard exclusions for Python (`__pycache__/`, `venv/`, `.pytest_cache/`), Node (`node_modules/`, `.next/`), Flutter (`.dart_tool/`, `build/`), environment files (`.env`), and SQLite databases (`*.db`).

- [ ] **Step 2: Create root `.env.example`**
  Specify environment variables:
  ```env
  # App & Security
  SECRET_KEY=generate_a_secure_jwt_secret_key_here
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=60
  REFRESH_TOKEN_EXPIRE_DAYS=30
  FERNET_ENCRYPTION_KEY=generate_base64_32byte_fernet_key

  # Database
  DATABASE_URL=sqlite:///./devcommand.db
  # For Postgres: postgresql+asyncpg://postgres:postgres@localhost:5432/devcommand

  # GitHub Integration
  GITHUB_CLIENT_ID=your_github_oauth_client_id
  GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

  # Multi-Tier AI Cascade Keys
  OPENROUTER_API_KEY=your_openrouter_api_key
  GEMINI_API_KEY=your_gemini_api_key
  NVIDIA_API_KEY=your_nvidia_api_key
  ```

- [ ] **Step 3: Create top-level `docker-compose.yml`**
  Define services for `backend` (FastAPI, port 8000), `db` (PostgreSQL 16, port 5432), and `web` (Next.js, port 3000) for optional containerized local execution.

- [ ] **Step 4: Verify directory scaffolding**
  Check that workspace root contains `.gitignore`, `.env.example`, `docker-compose.yml`, and `README.md`.

---

## Phase 2: FastAPI Backend Core & Database Models

### Task 2.1: FastAPI Setup, Configuration & Database Session
**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/main.py`
- Test: `backend/tests/test_health.py`

- [ ] **Step 1: Write `backend/requirements.txt`**
  Include: `fastapi>=0.110.0`, `uvicorn[standard]>=0.28.0`, `sqlmodel>=0.0.16`, `alembic>=1.13.0`, `pydantic-settings>=2.2.0`, `pyjwt[crypto]>=2.8.0`, `passlib[bcrypt]>=1.7.4`, `cryptography>=42.0.0`, `httpx>=0.27.0`, `google-genai>=0.1.1`, `pytest>=8.0.0`, `pytest-asyncio>=0.23.0`.

- [ ] **Step 2: Implement `backend/app/core/config.py`**
  Define `Settings` using `pydantic_settings.BaseSettings` reading environment variables with defaults for local dev.

- [ ] **Step 3: Implement `backend/app/core/security.py`**
  Functions: `hash_password(password: str) -> str`, `verify_password(plain: str, hashed: str) -> bool`, `create_access_token(data: dict) -> str`, `encrypt_token(token: str) -> str`, `decrypt_token(encrypted: str) -> str`.

- [ ] **Step 4: Implement `backend/app/core/database.py`**
  Create SQLModel engine, `init_db()` function, and FastAPI dependency `get_session()`.

- [ ] **Step 5: Implement `backend/app/main.py`**
  FastAPI application with CORS middleware (allowing Flutter and Web origins) and `/api/v1/health` endpoint.

- [ ] **Step 6: Write and run health check test**
  Run: `pytest backend/tests/test_health.py -v`
  Expected: PASS with 200 OK and `{"status": "healthy"}`.

---

### Task 2.2: SQLModel Schemas & Relational Models
**Files:**
- Create: `backend/app/models/enums.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/project.py`
- Create: `backend/app/models/feature.py`
- Create: `backend/app/models/future_project.py`
- Create: `backend/app/models/ai_log.py`
- Test: `backend/tests/test_models.py`

- [ ] **Step 1: Define Enums in `backend/app/models/enums.py`**
  - `ProjectType`: `COLLEGE`, `RESUME`, `PRODUCTION`
  - `ProjectStatus`: `IDEATION`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `ARCHIVED`
  - `FeaturePriority`: `P0`, `P1`, `P2`, `P3`
  - `FeatureStatus`: `BACKLOG`, `IN_PROGRESS`, `DONE`
  - `FutureProjectPriority`: `P0`, `P1`, `P2`
  - `FutureProjectStatus`: `IDEA`, `PLANNING`, `PROMOTED`, `DISCARDED`

- [ ] **Step 2: Define Models with SQLModel**
  Implement `User`, `Project`, `Feature`, `FutureProject`, and `AILog` with foreign keys, relationships, cascade deletes, and indexing.

- [ ] **Step 3: Write tests for Model persistence & relationships**
  Test creating a user &rarr; adding projects &rarr; adding features &rarr; calculating weighted progress.
  Run: `pytest backend/tests/test_models.py -v`
  Expected: PASS.

---

## Phase 3: Authentication & Security System

### Task 3.1: User Registration, Login & Current User Dependency
**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/app/api/deps.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Write Pydantic DTOs in `backend/app/schemas/auth.py`**
  `UserRegisterRequest`, `UserLoginRequest`, `TokenResponse`, `UserProfileResponse`.

- [ ] **Step 2: Implement Auth Router in `backend/app/api/v1/auth.py`**
  Endpoints:
  - `POST /register`: Validates email uniqueness, hashes password, returns JWT tokens.
  - `POST /login`: Validates credentials, returns JWT tokens.
  - `GET /me`: Returns authenticated user info.

- [ ] **Step 3: Implement Auth Dependency in `backend/app/api/deps.py`**
  `get_current_user(token: str, session: Session) -> User` with `HTTPBearer` security scheme.

- [ ] **Step 4: Implement GitHub OAuth flow endpoints**
  Endpoints:
  - `GET /github/url`: Generates authorization URL with state parameter.
  - `POST /github/callback`: Exchanges auth code for user access token via GitHub API, finds or creates user record, stores encrypted token.

- [ ] **Step 5: Write and run Auth tests**
  Run: `pytest backend/tests/test_auth.py -v`
  Expected: PASS (registration, login, invalid credentials rejected, token verification).

---

## Phase 4: GitHub Ingestion & Repo Sync Engine

### Task 4.1: GitHub API Client & Ingestion Service
**Files:**
- Create: `backend/app/services/github_service.py`
- Create: `backend/app/schemas/github.py`
- Create: `backend/app/api/v1/github.py`
- Test: `backend/tests/test_github_sync.py`

- [ ] **Step 1: Implement `GitHubService` in `backend/app/services/github_service.py`**
  - `fetch_user_repositories(token: str) -> list[dict]`: Calls `https://api.github.com/user/repos?sort=created&per_page=100`.
  - `fetch_repo_readme(token: str, owner: str, repo: str) -> str | None`: Fetches raw README content.
  - `sync_repositories(user_id: UUID, session: Session) -> SyncResult`: Fetches repos, checks for existing `github_repo_id`, creates new `Project` records marked `needs_review=True`.

- [ ] **Step 2: Implement GitHub Router in `backend/app/api/v1/github.py`**
  - `POST /token`: Updates user's encrypted GitHub PAT.
  - `POST /sync`: Runs `sync_repositories` on-demand, returns count of newly imported repos.
  - `GET /status`: Returns last sync time and token validation status.

- [ ] **Step 3: Mock GitHub API and run sync test**
  Run: `pytest backend/tests/test_github_sync.py -v`
  Expected: PASS (ingests 3 mocked repos, ignores existing duplicate repo, marks `needs_review=True`).

---

## Phase 5: Multi-Tiered AI Cascade Engine

### Task 5.1: Multi-Provider AI Service (OpenRouter &rarr; Gemini &rarr; NVIDIA)
**Files:**
- Create: `backend/app/services/ai_service.py`
- Create: `backend/app/services/ai_prompts.py`
- Create: `backend/app/schemas/ai.py`
- Create: `backend/app/api/v1/ai.py`
- Test: `backend/tests/test_ai_service.py`

- [ ] **Step 1: Define System Prompts in `backend/app/services/ai_prompts.py`**
  - `TRIAGE_PROMPT`: Directs LLM to analyze repo name, description, and README &rarr; output JSON with `suggested_project_type`, `suggested_goal`, `suggested_initial_features`.
  - `NEXT_FEATURES_PROMPT`: Directs LLM to evaluate project type, goal, stack, and completed features &rarr; output JSON with 3–5 prioritized next features (`title`, `description`, `priority`, `rationale`).
  - `NEXT_PROJECTS_PROMPT`: Directs LLM to review user's existing projects &rarr; suggest 3 distinct project ideas with target tech stack and expected impact.

- [ ] **Step 2: Implement `AIService` with 3-tier fallback in `backend/app/services/ai_service.py`**
  - Calls `_call_openrouter()` with timeout (6s) &rarr; on failure/429 calls `_call_gemini()` &rarr; on failure calls `_call_nvidia()`.
  - Enforces strict JSON output schema.
  - Records which provider fulfilled the request in `AILog`.

- [ ] **Step 3: Implement AI API Endpoints in `backend/app/api/v1/ai.py`**
  - `POST /triage-repo/{project_id}`: Triggers auto-triage for a project.
  - `POST /suggest-project-features/{project_id}`: Returns next feature recommendations.
  - `POST /suggest-next-projects`: Returns new project proposals.

- [ ] **Step 4: Test fallback mechanism with simulated provider timeouts**
  Run: `pytest backend/tests/test_ai_service.py -v`
  Expected: PASS (Tier 1 fails &rarr; Tier 2 successfully returns JSON).

---

## Phase 6: Projects, Features & Future Projects REST APIs

### Task 6.1: Project & Feature Backlog Management Endpoints
**Files:**
- Create: `backend/app/schemas/project.py`
- Create: `backend/app/schemas/feature.py`
- Create: `backend/app/api/v1/projects.py`
- Create: `backend/app/api/v1/features.py`
- Test: `backend/tests/test_projects_api.py`

- [ ] **Step 1: Implement Project CRUD & Triage in `backend/app/api/v1/projects.py`**
  - `GET /`: Lists projects with filters (`status`, `project_type`, `needs_review`, `search`). Computes progress % dynamically.
  - `GET /{id}`: Details with full feature breakdown and progress statistics.
  - `PATCH /{id}`: Update goal, type, status, or manual progress override.
  - `POST /{id}/confirm-triage`: Clears `needs_review` flag with user-verified attributes.
  - `DELETE /{id}`: Delete or archive project.

- [ ] **Step 2: Implement Feature Checklist & Progress Tracking in `backend/app/api/v1/features.py`**
  - `GET /projects/{id}/features`: List features grouped by status and priority.
  - `POST /projects/{id}/features`: Add new feature item.
  - `PATCH /features/{id}`: Toggle status (`BACKLOG`, `IN_PROGRESS`, `DONE`), update priority.
  - `DELETE /features/{id}`: Delete feature.

- [ ] **Step 3: Write tests for progress calculation and status transitions**
  Run: `pytest backend/tests/test_projects_api.py -v`
  Expected: PASS (adding/completing P0 and P1 features correctly updates project progress %).

---

### Task 6.2: Future Project Priority List (Idea Incubator)
**Files:**
- Create: `backend/app/schemas/future_project.py`
- Create: `backend/app/api/v1/future_projects.py`
- Test: `backend/tests/test_future_projects.py`

- [ ] **Step 1: Implement Future Project Endpoints in `backend/app/api/v1/future_projects.py`**
  - `GET /`: Lists ideas sorted by priority (`P0` &rarr; `P1` &rarr; `P2`).
  - `POST /`: Add idea manually or from AI suggestion.
  - `PATCH /{id}`: Update priority, tech stack, or notes.
  - `POST /{id}/promote`: Converts future idea into an active `Project`, optionally links to GitHub repo, and marks status `PROMOTED`.
  - `DELETE /{id}`: Discard idea.

- [ ] **Step 2: Test idea creation and promotion flow**
  Run: `pytest backend/tests/test_future_projects.py -v`
  Expected: PASS (promoting an idea creates a corresponding Project record).

---

## Phase 7: Next.js Web Frontend

### Task 7.1: Next.js Project Setup & Design System
**Files:**
- Create: `web/package.json`
- Create: `web/src/lib/api.ts`
- Create: `web/src/lib/store.ts`
- Create: `web/src/components/Navbar.tsx`
- Create: `web/src/components/Sidebar.tsx`
- Create: `web/src/app/layout.tsx`

- [ ] **Step 1: Initialize Next.js project with Tailwind CSS & TypeScript**
  Configure theme with sleek dark mode palette (slate/indigo/emerald tokens), Lucide React icons, and Inter font.

- [ ] **Step 2: Build API Client & State Store**
  - Implement Axios/fetch wrapper with JWT interceptor for token refresh.
  - Build Zustand store for active user, projects, and sync status.

- [ ] **Step 3: Build responsive App Shell Layout**
  Collapsible sidebar, top header with "Sync GitHub" button, and user profile avatar.

---

### Task 7.2: Web Dashboard & Project Detail Views
**Files:**
- Create: `web/src/app/dashboard/page.tsx`
- Create: `web/src/app/projects/[id]/page.tsx`
- Create: `web/src/components/ProjectCard.tsx`
- Create: `web/src/components/NeedsReviewBanner.tsx`
- Create: `web/src/components/FeatureBacklog.tsx`
- Create: `web/src/components/AIFeatureSuggestionsModal.tsx`

- [ ] **Step 1: Implement Dashboard View (`/dashboard`)**
  - Metrics row: Total Projects, Active Projects, Average Progress %, Pending Review repos.
  - Needs Review alert tray (shows newly synced GitHub repos with 1-click triage review modal).
  - Project Grid with filter tabs (`All`, `College`, `Resume`, `Production Ready`).
  - Project Cards displaying progress bar, priority badge, repo stats, and primary language chip.

- [ ] **Step 2: Implement Project Detail & Feature Backlog View (`/projects/[id]`)**
  - Header: Title, GitHub link, Project Type selector, Goal editable banner.
  - Progress Gauge with weighted progress formula & manual override toggle.
  - Feature Backlog board: Grouped by Priority (`P0`, `P1`, `P2`, `P3`) and Status (`Backlog`, `In Progress`, `Done`).
  - Quick-add feature input with priority selector.

- [ ] **Step 3: Implement AI Suggestions Drawer**
  - "Suggest Next Features" button triggers `/api/v1/ai/suggest-project-features/{id}`.
  - Shows recommended features with rationale and "+ Add to Backlog" buttons.

---

### Task 7.3: Future Projects & AI Discovery View
**Files:**
- Create: `web/src/app/ideas/page.tsx`
- Create: `web/src/components/FutureProjectCard.tsx`
- Create: `web/src/components/AISuggestProjectModal.tsx`

- [ ] **Step 1: Implement Future Ideas Board (`/ideas`)**
  - Ranked columns or list: P0 (Next Up), P1 (High Priority), P2 (Backlog).
  - Card with tech stack tags, elevator pitch, and "Promote to Active" action modal.

- [ ] **Step 2: Implement AI Project Discovery Modal**
  - Calls `/api/v1/ai/suggest-next-projects`.
  - Displays 3 generated ideas with "Save to Future Ideas" button.

---

## Phase 8: Flutter Android Mobile Application

### Task 8.1: Flutter Project Initialization & Theme
**Files:**
- Create: `mobile/pubspec.yaml`
- Create: `mobile/lib/core/theme.dart`
- Create: `mobile/lib/core/api_client.dart`
- Create: `mobile/lib/core/storage.dart`
- Create: `mobile/lib/main.dart`

- [ ] **Step 1: Configure `pubspec.yaml`**
  Dependencies: `flutter_riverpod`, `dio`, `flutter_secure_storage`, `cached_network_image`, `intl`, `flutter_slidable`, `percent_indicator`.

- [ ] **Step 2: Implement Material 3 Dark/Light Theme & Storage**
  - Setup color palette matching web design.
  - Implement secure token storage using `flutter_secure_storage`.

- [ ] **Step 3: Implement Dio HTTP Client with Auth Interceptor**
  Auto-attaches `Bearer <token>` and handles 401 token refresh.

---

### Task 8.2: Mobile Screens & On-The-Go Experience
**Files:**
- Create: `mobile/lib/screens/dashboard_screen.dart`
- Create: `mobile/lib/screens/project_detail_screen.dart`
- Create: `mobile/lib/screens/future_ideas_screen.dart`
- Create: `mobile/lib/screens/triage_modal.dart`
- Create: `mobile/lib/widgets/progress_card.dart`
- Create: `mobile/lib/widgets/feature_tile.dart`

- [ ] **Step 1: Implement Bottom Navigation Shell**
  Tabs: Dashboard, Projects, Future Ideas, AI Assistant.

- [ ] **Step 2: Implement Dashboard Screen with Pull-To-Refresh**
  - Swiping down triggers GitHub sync API.
  - "Needs Review" carousel at the top for newly ingested repos.
  - Compact project cards with circular progress indicator and priority chip.

- [ ] **Step 3: Implement Project Detail & Swipeable Feature Checklist**
  - Uses `flutter_slidable`: Swiping right marks feature `Done`, swiping left deletes or edits.
  - Floating Action Button (FAB) to quickly add a feature or trigger "AI Feature Suggestions".

- [ ] **Step 4: Implement Future Ideas Screen**
  - Tabbed or sorted by P0 / P1 / P2.
  - Long press to promote idea into an active project.

---

## Phase 9: Deployment, Dockerization & Verification

### Task 9.1: Dockerfile & Production Deployment Setup
**Files:**
- Create: `backend/Dockerfile`
- Create: `web/Dockerfile`
- Modify: `docker-compose.yml`
- Create: `docs/deployment.md`

- [ ] **Step 1: Build & test Backend Docker container**
  Verify container boots and passes health check:
  Run: `docker build -t devcommand-backend ./backend`

- [ ] **Step 2: Write deployment guide (`docs/deployment.md`)**
  Instructions for:
  - 1-click backend deployment to Render / Railway with PostgreSQL.
  - 1-click web deployment to Vercel.
  - Building Android APK via `flutter build apk --release`.

- [ ] **Step 3: Run full backend automated test suite**
  Run: `pytest backend/tests/ -v --tb=short`
  Expected: All unit & integration tests pass with 100% green status.
