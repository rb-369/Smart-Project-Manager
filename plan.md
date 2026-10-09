# Personal Project Manager (DevCommand)

## 📌 Original Concept & Requirements
- **Core Idea:** Personal Project Manager that automatically populates new GitHub repositories onto the dashboard with details, project type, status, etc.
- **Future Project Priority List:** Ranked list of projects to build in the future, with AI recommendations on what project to do next.
- **Feature Addition List per Project:** Ranked feature backlog for each project with priority tags.
- **Progress Tracking:** Tracks percentage completion based on goals and feature completion.
- **AI Feature Recommendations:** Suggests "What to do next in this project" tailored to the project's goal.
- **Project Classification:** College Project, Resume-Level Project, or Production-Ready SaaS.
- **Cross-Platform:** Android mobile (daily quick capture/reviews) and Desktop Web (deep work/dashboard).

---

## 📑 Formal Documentation & Execution Roadmap

The full specifications and phased implementation tasks have been drafted and locked:

1. **[Product Requirements Document (PRD)](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/PRD.md)**
   - Detailed user personas and scope boundaries
   - System architecture (FastAPI + Next.js + Flutter)
   - Database schema & ERD (Users, Projects, Features, Future Projects, AI Logs)
   - REST API contracts for all endpoints
   - Multi-tier AI fallback engine (`OpenRouter` &rarr; `Gemini` &rarr; `NVIDIA`)
   - Security, encryption, and multi-tenancy rules

2. **[Execution & Implementation Plan](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/EXECUTION_PLAN.md)**
   - **Phase 1:** Workspace & Monorepo Foundation
   - **Phase 2:** FastAPI Backend Core & Database Models
   - **Phase 3:** Authentication & Security System (JWT + GitHub OAuth)
   - **Phase 4:** GitHub Ingestion & Repo Sync Engine (PAT + Polling)
   - **Phase 5:** Multi-Tiered AI Cascade Engine (OpenRouter &rarr; Gemini &rarr; NVIDIA)
   - **Phase 6:** Projects, Features & Future Projects REST APIs
   - **Phase 7:** Next.js Web Frontend (Dashboard, Backlogs, AI Drawers)
   - **Phase 8:** Flutter Android Mobile App (Material 3, Pull-to-refresh, Swipeable tasks)
   - **Phase 9:** Deployment, Dockerization & Verification
