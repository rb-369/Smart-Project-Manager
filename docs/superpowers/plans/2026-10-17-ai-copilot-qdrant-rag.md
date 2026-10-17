# AI Copilot with Qdrant Cloud RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive AI Copilot interface with a dedicated `/chat` page, global bottom-right floating launcher icon, three specialized modes (Feature Planner, Researcher, and Brutal Judge), and Qdrant Cloud vector search for multi-tenant RAG.

**Architecture:** Qdrant Cloud indexes project metadata, features, and ideas into dense vectors using FastEmbed (`BAAI/bge-small-en-v1.5`). Queries are vectorized, similarity-searched with strict `user_id` payload filtering, and injected as RAG ground-truth context into the multi-tier AI inference cascade. The frontend provides a full-featured `/chat` interface with mode switching, judge score gauges, and a floating launcher dock across all pages.

**Tech Stack:** Python 3.11+, FastAPI, `qdrant-client`, `fastembed`, Next.js 16 (Turbopack), Tailwind CSS, Lucide React, Pytest.

## Global Constraints

- Backend must remain operational even if `QDRANT_URL` or `QDRANT_API_KEY` are initially unconfigured, providing clear status telemetry without crashing.
- Multi-tenant isolation: all Qdrant vector points MUST include `user_id` in their payload and all searches MUST enforce `user_id == current_user.id`.
- The Judge mode MUST output an explicit score out of 100, a clear verdict signal (`🟢 BUILD THIS NOW` / `🟡 PROCEED WITH CAUTION` / `🔴 DO NOT BUILD / REJECT`), and a brutal critique.
- Feature Planner mode MUST format recommendations with title, description, and priority so the user can add them to their roadmap with 1 click.
- All code must pass full pytest suite and Next.js `npm run build` with 0 errors.

---

### Task 1: Backend Dependencies & Qdrant Configuration

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`
- Modify: `.env`

- [ ] **Step 1: Add `qdrant-client` and `fastembed` to `backend/requirements.txt`**
- [ ] **Step 2: Add `QDRANT_URL`, `QDRANT_API_KEY`, and `QDRANT_COLLECTION` to `Settings` in `backend/app/core/config.py`**
- [ ] **Step 3: Update `.env.example` and local `.env` with Qdrant Cloud template variables**
- [ ] **Step 4: Install dependencies in backend virtual environment**
  Run: `powershell -Command ".\backend\venv\Scripts\pip install qdrant-client fastembed"`
- [ ] **Step 5: Verify settings load with pytest**
  Run: `powershell -Command ".\backend\venv\Scripts\pytest -q"`

---

### Task 2: Qdrant Connection Manager & RAG Service

**Files:**
- Create: `backend/app/core/qdrant.py`
- Create: `backend/app/services/rag_service.py`

- [ ] **Step 1: Write `backend/app/core/qdrant.py`**
  - Implement `get_qdrant_client()` returning a configured `QdrantClient` for Qdrant Cloud when credentials exist.
  - Implement `check_qdrant_connection()` reporting connectivity, cluster latency, and collection status.
  - Implement `ensure_collection_exists()` creating the `devcommand_knowledge` collection with Cosine distance and 384 dimensions.
- [ ] **Step 2: Write `backend/app/services/rag_service.py`**
  - Initialize FastEmbed `TextEmbedding("BAAI/bge-small-en-v1.5")`.
  - Implement `index_project(project, user_id)`: vectors name, goal, and README summary.
  - Implement `index_feature(feature, project_name, user_id)`: vectors feature title, description, priority.
  - Implement `index_future_project(idea, user_id)`: vectors elevator pitch and tech stack.
  - Implement `search_knowledge(query, user_id, project_id=None, limit=5)`: generates vector embedding and performs similarity search in Qdrant with `Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))])`.

---

### Task 3: AI Copilot Service (Planner, Researcher, Judge)

**Files:**
- Create: `backend/app/services/copilot_service.py`
- Modify: `backend/app/services/mongodb_sync.py` (hook RAG indexing on project/feature writes)

- [ ] **Step 1: Implement `CopilotService` in `backend/app/services/copilot_service.py`**
  - Define system prompts for each mode:
    - `planner`: Principal Product Architect. Decomposes features into technical checklists, schema changes, API routes, edge cases, and suggests priority (P0 to P3).
    - `researcher`: Market & Feasibility Analyst. Researches competitors who built this, compares technical feasibility, and flags architecture risks.
    - `judge`: Brutally honest evaluator. Returns JSON or structured response with `score` (0-100), `verdict_signal` (`BUILD_NOW`, `PROCEED_WITH_CAUTION`, `DO_NOT_BUILD`), `verdict_title`, `brutal_critique`, `failure_modes`, and `what_to_build_instead`.
  - Implement `generate_copilot_response(message, mode, user_id, project_id=None, chat_history=[])`:
    - Retrieves RAG context via `RAGService.search_knowledge`.
    - Dispatches to AI Cascade engine (OpenRouter -> Gemini -> NVIDIA).
    - Parses structured metadata (judge score, planner actions) and attaches retrieved RAG citations.

---

### Task 4: Copilot API Router & Endpoints

**Files:**
- Create: `backend/app/api/v1/chat.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Implement `chat.py` API endpoints:**
  - `POST /api/v1/chat/message`: Process chat message, returns answer, mode, citations, and metadata.
  - `GET /api/v1/chat/qdrant-status`: Returns live Qdrant Cloud health and collection stats.
  - `POST /api/v1/chat/sync-knowledge`: Scans current user's projects, features, and ideas and vectorizes them into Qdrant Cloud.
- [ ] **Step 2: Register router in `backend/app/main.py` under `/chat`**

---

### Task 5: Backend Automated Tests for Copilot & RAG

**Files:**
- Create: `backend/tests/test_copilot_rag.py`

- [ ] **Step 1: Write tests for:**
  - Qdrant connection status check (configured and unconfigured states).
  - FastEmbed embedding generation and dimensional shape (384 floats).
  - RAG multi-tenant filter assertion (User A cannot match User B vectors).
  - Copilot planner mode response.
  - Copilot researcher mode response.
  - Copilot judge mode response with score between 0 and 100.
- [ ] **Step 2: Run pytest to verify all tests pass:**
  Run: `powershell -Command ".\backend\venv\Scripts\pytest tests/test_copilot_rag.py -v"`

---

### Task 6: Frontend Types & API Client Integration

**Files:**
- Modify: `web/src/types/index.ts`
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Add Copilot and Qdrant interfaces to `web/src/types/index.ts`:**
  - `CopilotMode = 'planner' | 'researcher' | 'judge'`
  - `ChatMessage`: `id`, `sender`, `content`, `mode`, `timestamp`, `ragSources`, `judgeData`, `suggestedFeatures`
  - `JudgeVerdict`: `score`, `signal` ('BUILD_NOW' | 'PROCEED_WITH_CAUTION' | 'DO_NOT_BUILD'), `verdictTitle`, `brutalCritique`, `failureModes`, `whatToBuildInstead`
  - `QdrantStatus`: `configured`, `connected`, `message`, `collection`, `pointsCount`
- [ ] **Step 2: Add API client helper methods for `/chat/message`, `/chat/qdrant-status`, and `/chat/sync-knowledge`**

---

### Task 7: Dedicated Copilot Page (`/chat`)

**Files:**
- Create: `web/src/app/chat/page.tsx`

- [ ] **Step 1: Build the `/chat` route with:**
  - Electric blue and dark grid aesthetics matching DevCommand.
  - Mode Switcher:
    - `⚡ Feature Planner`: Technical blueprints & roadmap planning
    - `🔍 Market Researcher`: Competitors, market landscape & tech feasibility
    - `⚖️ The Judge`: Brutally honest evaluation with score /100 and verdict signal
  - Project Selector dropdown to focus query on a specific project or brainstorm globally.
  - Qdrant Cloud RAG status indicator pill.
  - Rich chat feed with:
    - Judge score gauge & verdict banner.
    - Feature planner 1-click "Add to Project Roadmap" button.
    - Qdrant vector citation pills.
    - Quick prompt starter chips for each mode.

---

### Task 8: Global Floating Launcher & Navigation Links

**Files:**
- Create: `web/src/components/ChatLauncher.tsx`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/components/Navbar.tsx`
- Modify: `web/src/components/Sidebar.tsx`

- [ ] **Step 1: Build `web/src/components/ChatLauncher.tsx`:**
  - Floating circular dock button fixed at bottom-right (`bottom-6 right-6 z-50`).
  - Neon lime & electric blue glowing styling with bot icon and live indicator.
  - Clicking opens a slide-over quick drawer or expands to full `/chat` page.
- [ ] **Step 2: Add `<ChatLauncher />` inside `<AuthProvider>` in `web/src/app/layout.tsx`**
- [ ] **Step 3: Add `Copilot AI` nav link to `Navbar.tsx` and `Sidebar.tsx`**

---

### Task 9: Fullstack Verification & Git Commit/Push

- [ ] **Step 1: Run backend tests:**
  Run: `powershell -Command ".\backend\venv\Scripts\pytest -v"`
- [ ] **Step 2: Run frontend build:**
  Run: `cmd /c "npm run build"` in `web/`
- [ ] **Step 3: Commit and push changes to `origin/main`**
