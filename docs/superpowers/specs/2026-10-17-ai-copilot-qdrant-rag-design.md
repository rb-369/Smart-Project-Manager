# Design Specification: DevCommand AI Copilot with Qdrant Cloud RAG

**Date:** 2026-10-17  
**Status:** Approved  
**Author:** AI Pair Architect & User  

---

## 1. Overview & Objectives

Add a specialized, interactive AI Copilot interface to DevCommand featuring:
1. **Dedicated Chatbot Page (`/chat`)** and a **Global Floating Launcher Icon** at the bottom-right of every view.
2. **Three Specialized Operational Modes:**
   - **Feature Planner (`planner`)**: Decomposes user ideas into technical specs, schema migrations, API routes, edge cases, and P0–P3 roadmap items with 1-click addition.
   - **Researcher (`researcher`)**: Researches real-world competitors with similar features, analyzes technical feasibility, architectural trade-offs, and dependency requirements.
   - **The Judge (`judge`)**: Brutally honest evaluator scoring the proposed feature out of 100, assigning a clear verdict signal (`🟢 BUILD THIS NOW`, `🟡 PROCEED WITH CAUTION`, `🔴 DO NOT BUILD / REJECT`), and detailing why it might fail.
3. **Qdrant Cloud RAG (Retrieval-Augmented Generation):**
   - Ingests and vectorizes the user's active projects, roadmap features, incubator ideas, and GitHub repository context.
   - Embeds incoming queries using `fastembed` (`BAAI/bge-small-en-v1.5`, 384 dims, zero API costs).
   - Enforces strict multi-tenant isolation by filtering vectors on `user_id`.
   - Injects the retrieved context into the multi-tier AI inference cascade (OpenRouter &rarr; Gemini &rarr; NVIDIA) to generate grounded, context-aware responses.

---

## 2. Architecture & Data Flow

```
[ User Prompt / Mode / Project ID ]
                 │
                 ▼
     [ FastEmbed (384-dim) ]
                 │
                 ▼
  [ Qdrant Cloud Vector Search ]  <── Filter: { user_id: current_user.id }
  (Finds matching features, goals, tech stacks)
                 │
                 ▼
  [ RAG Context Injection + Mode Persona Prompt ]
                 │
                 ▼
  [ Multi-Tier AI Cascade Engine ]
  (Tier 1: OpenRouter ──> Tier 2: Gemini ──> Tier 3: NVIDIA)
                 │
                 ▼
      [ Structured AI Response ]
      - Planner: Checklist, API spec, 1-click feature payload
      - Researcher: Competitors, Feasibility, Architecture Risks
      - Judge: Score /100, Verdict Signal, Hard Truths, What to build instead
```

---

## 3. Backend Implementation Specification

### 3.1 Dependencies
- `qdrant-client>=1.9.0`
- `fastembed>=0.2.7`

### 3.2 Configuration (`backend/app/core/config.py`)
- `QDRANT_URL: str = ""` (Qdrant Cloud cluster URL e.g. `https://xxxx.eu-central.aws.cloud.qdrant.io:6333`)
- `QDRANT_API_KEY: str = ""` (Qdrant Cloud API Key)
- `QDRANT_COLLECTION: str = "devcommand_knowledge"`

### 3.3 Core Modules
1. `backend/app/core/qdrant.py`:
   - Connection manager for Qdrant Cloud client.
   - Safe verification and collection creation with cosine similarity and 384-dimension vector configuration.
   - Indexing helper that vectors payload with `user_id`, `entity_type` (`project`, `feature`, `future_project`), `title`, and `content`.
2. `backend/app/services/rag_service.py`:
   - `index_project(project, user_id)`: indexes repository metadata and goals.
   - `index_feature(feature, project, user_id)`: indexes roadmap feature.
   - `index_future_project(idea, user_id)`: indexes incubator idea.
   - `search_context(query, user_id, project_id=None, limit=5)`: generates vector embedding with FastEmbed and performs similarity search in Qdrant Cloud.
3. `backend/app/services/copilot_service.py`:
   - Handles multi-turn chat prompts across `planner`, `researcher`, and `judge` modes.
   - Formulates system and user prompts with RAG context citations.
   - Dispatches to the AI cascade engine.
4. `backend/app/api/v1/chat.py`:
   - `POST /api/v1/chat/message`: Receives message, mode, optional `project_id`, returns AI response, RAG sources, and structured metadata (e.g. judge score, verdict).
   - `GET /api/v1/chat/qdrant-status`: Reports Qdrant Cloud cluster connectivity, collection point count, and latency.
   - `POST /api/v1/chat/sync-knowledge`: Manually re-indexes all projects, features, and ideas for the current user into Qdrant Cloud.

---

## 4. Frontend Implementation Specification

### 4.1 Routes & Components
1. **Dedicated Chat Page: [`web/src/app/chat/page.tsx`](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/web/src/app/chat/page.tsx)**
   - Mode Selector Header Tabs:
     - `⚡ Feature Planner`: Technical blueprints & roadmap planning
     - `🔍 Market Researcher`: Competitors, market landscape & tech feasibility
     - `⚖️ The Judge`: Brutally honest evaluation with score /100 and verdict signal
   - Project Selector: Choose a specific project to ground context or brainstorm globally.
   - Message Stream:
     - Rich message cards with code snippets, markdown, and bullet points.
     - Mode-specific widgets:
       - **Judge Banner**: Score gauge (e.g., `Score: 78/100`), Verdict Pill (`🟢 BUILD THIS NOW` / `🟡 PROCEED WITH CAUTION` / `🔴 DO NOT BUILD / REJECT`), and Brutal Critique section.
       - **Planner Quick Action**: "Add to Project Roadmap" button which calls `POST /api/v1/projects/{id}/features` directly from chat.
       - **RAG Citation Pill**: Displays documents retrieved from Qdrant Cloud.
2. **Global Floating Launcher: [`web/src/components/ChatLauncher.tsx`](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/web/src/components/ChatLauncher.tsx)**
   - Fixed bottom-right launcher button (`z-50`) with an electric blue & neon glowing icon and status pill.
   - Accessible on all routes (`/dashboard`, `/projects/[id]`, `/ideas`, `/settings`).
   - Quick click opens slide-over drawer for fast queries or allows 1-click jump to `/chat`.
3. **Navbar & Navigation Links:**
   - Add `Copilot` link with a spark icon in [`web/src/components/Navbar.tsx`](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/web/src/components/Navbar.tsx) and [`web/src/components/Sidebar.tsx`](file:///c:/Users/Rudra/OneDrive/Desktop/Project-manager/web/src/components/Sidebar.tsx).

---

## 5. Verification Plan
1. Backend Unit & Integration Tests:
   - Test Qdrant connection manager & FastEmbed vector generation.
   - Test RAG context retrieval and tenant isolation.
   - Test chat endpoints across `planner`, `researcher`, and `judge` modes.
2. Frontend Compilation & E2E Validation:
   - `npm run build` must compile cleanly with 0 TypeScript or dynamic rendering errors.
   - Verify UI components render mode changes, judge score meters, and RAG badges.
