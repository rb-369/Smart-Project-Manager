# DevCommand 🚀
**Personal Project Manager with GitHub Ingestion & Multi-Tier AI Recommendations**

DevCommand is a developer command center designed for tracking, prioritizing, and growing projects across **Android (Flutter)** and **Web (Next.js)**, backed by a unified **Python FastAPI** API.

---

## 🌟 Key Features

1. **Automatic GitHub Ingestion**: Syncs repositories via Personal Access Token (PAT) with automatic deduplication.
2. **Project Categorization**: Classifies repos into `College Project`, `Resume Portfolio`, or `Production Ready`.
3. **AI Auto-Triage & Needs-Review Tray**: Analyzes README and code context to suggest goals and initial features upon repo discovery.
4. **Weighted Progress Tracking**: Calculates true completion % using priority weights ($P_0=4, P_1=3, P_2=2, P_3=1$).
5. **Future Project Incubator**: Prioritized idea queue ($P_0/P_1/P_2$) with 1-click promotion to active projects.
6. **Multi-Tier AI Fallback Engine**:
   - **Tier 1:** OpenRouter (Free models)
   - **Tier 2 (Fallback):** Google Gemini (Free tier)
   - **Tier 3 (Fallback):** NVIDIA NIM (Free inference tier)
7. **Dual Authentication**: Standard Email/Password JWT + GitHub OAuth login with complete user isolation.

---

## 🏗️ Monorepo Structure

- `backend/`: FastAPI REST API, SQLModel ORM, SQLite/PostgreSQL support, AI cascade service.
- `web/`: Next.js 14+ App Router, Tailwind CSS, Lucide icons, responsive dark-mode dashboard.
- `mobile/`: Flutter Android mobile application with pull-to-refresh sync and swipeable backlogs.
- `docs/`: PRD and architecture guides.

---

## 🚀 Quick Start (Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```
Swagger UI will be live at: `http://localhost:8000/docs`

### 2. Web Client Setup
```bash
cd web
npm install
npm run dev
```
Web dashboard will be live at: `http://localhost:3000`

### 3. Mobile Client Setup
```bash
cd mobile
flutter pub get
flutter run
```

---

## 📖 Specifications & Roadmap
- [Product Requirements Document (PRD.md)](./PRD.md)
- [Execution & Implementation Plan (EXECUTION_PLAN.md)](./EXECUTION_PLAN.md)
- [Original Concept (plan.md)](./plan.md)
