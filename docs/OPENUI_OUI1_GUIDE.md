# OpenUI & OUI-1 Generative UI in DevCommand

DevCommand integrates **OpenUI** and the **Thesys OUI-1** model architecture (`thesysdev/OUI-1`), allowing our Copilot AI chatbot to stream and render live, interactive user interfaces directly in conversations instead of static markdown alone.

---

## Architecture Overview

```
User Query / Pitch
       │
       ▼
DevCommand Copilot Service
       │
       ├──► Tier 0: Thesys OUI-1 (Local vLLM Text-Diffusion Engine)
       │    └─ DiffusionGemma 26B-A4B-it (FP8, ~1s generation)
       │
       └──► Fallback: AI Cascade Matrix with openui-lang DSL System Prompt
            ├─ Tier 1: OpenRouter (DeepSeek / Llama 3.3)
            ├─ Tier 2: Gemini 2.5 Flash (Google Cloud)
            └─ Tier 3: NVIDIA NIM (Llama 3.2 11B Vision Instruct)
       │
       ▼
Streams openui-lang DSL Code
       │
       ▼
Next.js Client (<OpenUIRenderer /> via @openuidev/react-lang)
       │
       ▼
Live Interactive React Components:
 • Container / Card Shells with Badges
 • Stack Layout (Flex Col/Row, Gaps)
 • StatMetric Telemetry Cards
 • VerdictCard (The Judge Sub-Agent Verdict)
 • TaskChecklist (Live Interactive Checkboxes & Progress Bar)
 • FeatureCard (One-Click "Add to Roadmap" Buttons)
 • ActionButton (Custom Action Triggering)
 • CodePreview (Syntax Highlighting & Instant Copy)
 • TechBadge (Stack Indicators for DB, Backend, Frontend, AI, Infra)
 • Callout (Alert Banners)
```

---

## 1. Running Thesys OUI-1 Locally via vLLM

If you have an NVIDIA GPU (e.g. RTX 3090, 4090, 5090, or A100/H100), you can run `thesysdev/OUI-1` locally at full diffusion speed.

### Prerequisites
```bash
pip install "vllm>=0.24"
```

### Launch Script

**Windows (PowerShell):**
```powershell
.\scripts\start_oui1_vllm.ps1
```

**Linux / macOS / WSL:**
```bash
chmod +x ./scripts/start_oui1_vllm.sh
./scripts/start_oui1_vllm.sh
```

**Manual CLI Command:**
```bash
vllm serve thesysdev/OUI-1 \
    --trust-remote-code \
    --max-model-len 16384 \
    --quantization fp8 \
    --served-model-name OUI-1 \
    --port 8001 \
    --host 0.0.0.0
```

Once running, DevCommand automatically detects the OUI-1 endpoint on `http://localhost:8001/v1` and routes UI generation directly through it.

---

## 2. Environment Configuration (`backend/.env`)

Configure the following variables in `backend/.env`:

```env
# OpenUI & OUI-1 Generative UI
OPENUI_ENABLED=True
OUI1_BASE_URL=http://localhost:8001/v1
OUI1_MODEL=OUI-1
OUI1_API_KEY=EMPTY
```

If the local OUI-1 server is not running or offline, DevCommand automatically falls back to **Gemini 2.5 Flash** or **OpenRouter** while generating identical, compliant `openui-lang` DSL components, meaning the user experience is always functional!

---

## 3. Supported Components in DevCommand

| Component | Props | Description |
|-----------|-------|-------------|
| `Container` | `title`, `badge?`, `variant?`, `children` | Top-level container card with variant styles (`default`, `highlight`, `dark`, `glass`, `warning`). |
| `Stack` | `children`, `direction?`, `gap?`, `wrap?` | Flex layout container (`col` or `row`, gaps `xs`, `sm`, `md`, `lg`). |
| `StatMetric` | `label`, `value`, `change?`, `status?`, `subtitle?` | High-visibility KPI card with status dots (`healthy`, `warning`, `critical`, `neutral`). |
| `VerdictCard` | `score`, `signal`, `title`, `critique?` | Executive verdict banner displaying The Judge's score (0-100) and recommendation. |
| `TaskChecklist` | `title`, `items`, `category?` | **Interactive task list** with clickable checkboxes that compute live completion progress! |
| `FeatureCard` | `title`, `priority`, `complexity?`, `description`, `actionId?`, `actionLabel?` | Feature blueprint card with a 1-click **"Add to Roadmap"** action button. |
| `ActionButton` | `label`, `actionId`, `variant?`, `icon?` | Action button triggering callbacks or follow-up prompts. |
| `CodePreview` | `code`, `language?`, `filename?` | Monospaced code block with a copy-to-clipboard button. |
| `TechBadge` | `label`, `category?`, `status?` | Stack layer indicator (`frontend`, `backend`, `database`, `ai`, `infra`, `auth`). |
| `Callout` | `title`, `message`, `type?` | Informational or warning alert banner (`info`, `warning`, `success`, `critical`). |

---

## 4. Syntax Example: openui-lang

```openui
root = Container("Real-Time Sprint Velocity & Architecture", "ACTIVE", "highlight", [metricsRow, featuresSection, checklistSection])
metricsRow = Stack([m1, m2, m3], "row", "md")
m1 = StatMetric("Sprint Velocity", "94%", "+8% vs sprint 11", "healthy")
m2 = StatMetric("Test Coverage", "89%", "240 passing", "healthy")
m3 = StatMetric("P0 Risks", "0", "All criticals resolved", "healthy")

featuresSection = Stack([f1, f2], "col", "sm")
f1 = FeatureCard("OAuth2 Refresh Token Rotation", "P0", "M", "Rotate refresh tokens with redis blacklist to prevent token replay attacks.", "add_feat_1", "Add to Roadmap")
f2 = FeatureCard("Live WebSocket Stream Dock", "P1", "S", "Client dock connecting directly to the vLLM text-diffusion socket.", "add_feat_2", "Add to Roadmap")

checklistSection = TaskChecklist("Sprint Delivery Checklist", ["Validate Pydantic schema contracts", "Index vectors into Qdrant Cloud", "Run Jest and Turbopack builds", "Deploy to Vercel and Render"], "ENGINEERING")
```

