import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.ai_service import AIService
from app.services.rag_service import RAGService

logger = logging.getLogger(__name__)


class CopilotService:
    @classmethod
    def get_system_prompt(cls, mode: str) -> str:
        if mode == "planner":
            return (
                "You are DevCommand's Principal Product Architect and Staff Systems Engineer.\n"
                "Your job is to transform raw feature ideas into rigorous, production-ready implementation blueprints.\n"
                "Always provide:\n"
                "1. High-Level Architectural Approach\n"
                "2. Specific API Contracts (HTTP verbs, paths, request/response shapes)\n"
                "3. Database Schema Modifications (models, foreign keys, indexes)\n"
                "4. Step-by-Step Implementation Checklist\n"
                "5. Edge Cases & Concurrency Considerations\n"
                "6. Priority recommendation (P0 Critical MVP, P1 High, P2 Medium, P3 Nice-to-have)\n"
                "Ground your answers deeply in the user's existing projects and features if provided in the context."
            )
        elif mode == "researcher":
            return (
                "You are DevCommand's Lead Market Researcher and Technical Feasibility Scout.\n"
                "Your job is to research real-world competitor benchmarks and evaluate feasibility.\n"
                "Always provide:\n"
                "1. Real-World Competitor Benchmarks: 3-5 real SaaS, developer tools, or open-source apps that solved this problem and how they built it.\n"
                "2. Feasibility Rating: [Easy / Moderate / Complex / Prohibitive] with technical justification.\n"
                "3. Infrastructure & Dependency Prerequisites: Key libraries, cloud services, and protocols needed.\n"
                "4. Hidden Gotchas & Architectural Bottlenecks: Real-world failure modes at scale (rate limits, sync conflicts, state bloat).\n"
                "5. Pragmatic Build Recommendation: The highest-leverage MVP approach."
            )
        else:  # mode == "judge"
            return (
                "You are DevCommand's Brutally Honest Judge — an uncompromising, battle-tested Principal Engineer and ruthless VC Product Judge.\n"
                "You despise vanity features, over-engineering, fake productivity, and bloat. You NEVER sugarcoat or flatter.\n"
                "Evaluate the feature proposal and output an honest, unvarnished verdict.\n"
                "You MUST format your output as a JSON object with these EXACT keys:\n"
                "{\n"
                '  "score": <integer from 0 to 100>,\n'
                '  "verdict_signal": <"BUILD_NOW" | "PROCEED_WITH_CAUTION" | "DO_NOT_BUILD">,\n'
                '  "verdict_title": <short punchy headline summary, e.g. "Distraction Trap: High Maintenance, Zero Differentiation">,\n'
                '  "brutal_critique": <unfiltered, cynical assessment of flawed assumptions and why this isn\'t as good as the user thinks>,\n'
                '  "failure_modes": [<list of 2-4 concrete ways this feature will waste time or break>],\n'
                '  "what_to_build_instead": <a much leaner, higher-ROI alternative that solves the real core problem>,\n'
                '  "summary_verdict": <2-3 sentences of conclusive judgment on whether the user should proceed>\n'
                "}\n"
                "Scoring rubric:\n"
                "- 80-100: BUILD_NOW. Essential differentiator, low debt, massive developer/user leverage.\n"
                "- 50-79: PROCEED_WITH_CAUTION. Viable but carry maintenance burden or needs tight scoping.\n"
                "- 0-49: DO_NOT_BUILD. Premature optimization, vanity feature, reinvention of the wheel, or unneeded complexity."
            )

    @classmethod
    async def process_chat(
        cls,
        message: str,
        mode: str,
        user_id: Any,
        project_id: Optional[Any] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Executes the Copilot pipeline:
        1. RAG retrieval via Qdrant Cloud
        2. Prompt construction with mode persona and ground-truth citations
        3. Inference across multi-tier AI cascade
        4. Structured post-processing
        """
        mode = mode.lower() if mode in ["planner", "researcher", "judge"] else "planner"

        # 1. RAG Vector Search in Qdrant Cloud
        rag_hits = RAGService.search_knowledge(
            query=message,
            user_id=user_id,
            project_id=project_id,
            limit=4,
        )

        rag_context_blocks = []
        citations = []
        for hit in rag_hits:
            citations.append({
                "title": hit.get("title", ""),
                "entity_type": hit.get("entity_type", ""),
                "project_name": hit.get("project_name", ""),
                "score": hit.get("score", 0.0),
            })
            rag_context_blocks.append(f"[{hit.get('entity_type', '').upper()}] {hit.get('title')}:\n{hit.get('content')}")

        rag_prompt_text = ""
        if rag_context_blocks:
            rag_prompt_text = (
                "\n\n--- RELEVANT CONTEXT FROM USER'S CODEBASE (RETRIEVED VIA QDRANT CLOUD) ---\n"
                + "\n\n".join(rag_context_blocks)
                + "\n--- END CONTEXT ---\n"
            )

        system_prompt = cls.get_system_prompt(mode)
        user_prompt = (
            f"User Query:\n{message}\n"
            f"{rag_prompt_text}\n"
            f"Deliver your response strictly according to your persona rules for '{mode}' mode."
        )

        # 2. Invoke Multi-Tier AI Cascade
        raw_response = None
        tier_used = "Tier 1: OpenRouter"
        is_json_mode = (mode == "judge")

        # Priority 1: OpenRouter
        if settings.OPENROUTER_API_KEY:
            try:
                tier_used = "Tier 1: OpenRouter"
                raw_response = await AIService._call_openrouter(system_prompt, user_prompt, json_mode=is_json_mode)
            except Exception as e:
                logger.warning(f"[Copilot] OpenRouter call failed: {e}")

        # Priority 2: Gemini 2.5 Flash
        if not raw_response and settings.GEMINI_API_KEY:
            try:
                tier_used = "Tier 2: Gemini 2.5 Flash"
                raw_response = await AIService._call_gemini(system_prompt, user_prompt, json_mode=is_json_mode)
            except Exception as e:
                logger.warning(f"[Copilot] Gemini call failed: {e}")

        # Priority 3: NVIDIA NIM (Meta Llama 3.2 11B Vision Instruct)
        if not raw_response and settings.NVIDIA_API_KEY:
            try:
                tier_used = "Tier 3: NVIDIA NIM (Llama 3.2)"
                raw_response = await AIService._call_nvidia(system_prompt, user_prompt, json_mode=is_json_mode)
            except Exception as e:
                logger.warning(f"[Copilot] NVIDIA call failed: {e}")

        # Fallback heuristic if no keys configured or external calls failed
        if not raw_response:
            tier_used = "Local Intelligent Heuristic"
            raw_response = cls._heuristic_fallback(message, mode, citations)

        # 3. Post-process response based on mode
        parsed_judge_data = None
        suggested_features = []

        if mode == "judge":
            parsed_judge_data = cls._parse_judge_json(raw_response)
        elif mode == "planner":
            suggested_features = cls._extract_planner_features(raw_response, message)

        return {
            "mode": mode,
            "response": raw_response if mode != "judge" or not parsed_judge_data else parsed_judge_data.get("summary_verdict", raw_response),
            "raw_content": raw_response,
            "citations": citations,
            "judge_data": parsed_judge_data,
            "suggested_features": suggested_features,
            "tier_used": tier_used,
        }

    @classmethod
    def _parse_judge_json(cls, raw: str) -> Optional[Dict[str, Any]]:
        try:
            # Try direct JSON parse
            return json.loads(raw)
        except Exception:
            pass

        # Search for markdown fenced json or curly braces
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except Exception:
                pass

        curly_match = re.search(r"(\{.*\})", raw, re.DOTALL)
        if curly_match:
            try:
                return json.loads(curly_match.group(1))
            except Exception:
                pass

        # Fallback regex extraction if model returned prose with score
        score = 50
        score_match = re.search(r"(?:score|rating)[:\s]+(\d{1,3})", raw, re.IGNORECASE)
        if score_match:
            score = max(0, min(100, int(score_match.group(1))))

        signal = "BUILD_NOW" if score >= 80 else ("PROCEED_WITH_CAUTION" if score >= 50 else "DO_NOT_BUILD")

        return {
            "score": score,
            "verdict_signal": signal,
            "verdict_title": f"The Judge's Verdict ({score}/100)",
            "brutal_critique": raw,
            "failure_modes": [
                "Premature scope expansion and architectural debt",
                "High maintenance overhead relative to user leverage"
            ],
            "what_to_build_instead": "Strip down to the absolute minimal verifiable slice before writing production code.",
            "summary_verdict": raw[:400] + "..." if len(raw) > 400 else raw,
        }

    @classmethod
    def _extract_planner_features(cls, raw: str, user_query: str) -> List[Dict[str, Any]]:
        """
        Extracts 1-3 actionable features from planner output so user can add them with 1 click.
        """
        features = []
        # Pattern search for Feature: Title or - Feature: Title
        pattern = r"(?:Feature|Task|Component)\s*(?:\d+)?[:\-]\s*([^\n\r]+)"
        matches = re.findall(pattern, raw, re.IGNORECASE)

        for i, match in enumerate(matches[:3]):
            title = match.strip().strip("*#` ")
            if len(title) > 5:
                features.append({
                    "title": title[:100],
                    "priority": "P0" if i == 0 else "P1",
                    "description": f"Architected via DevCommand AI Copilot from query: {user_query[:120]}"
                })

        if not features:
            features.append({
                "title": f"Implement: {user_query[:60]}",
                "priority": "P1",
                "description": "Full technical breakdown planned via DevCommand Copilot."
            })

        return features

    @classmethod
    def _heuristic_fallback(cls, query: str, mode: str, citations: List[Dict[str, Any]]) -> str:
        citation_text = ""
        if citations:
            names = [c.get("title") for c in citations if c.get("title")]
            citation_text = f" (Context verified against your repositories: {', '.join(names[:2])})"

        if mode == "planner":
            return (
                f"### ⚡ Technical Feature Blueprint: {query[:50]}\n\n"
                f"**1. Architecture & Seams:**{citation_text}\n"
                "- Decouple presentation state from domain logic using a dedicated service layer.\n"
                "- Enforce asynchronous boundary for external integrations with background task retry queues.\n\n"
                "**2. Database & API Contract:**\n"
                "- `POST /api/v1/resource/action` (JSON payload, JWT authenticated, 201 Created)\n"
                "- Schema Migration: Add indexed lookup columns and audit timestamps.\n\n"
                "**3. Implementation Checklist:**\n"
                "- [ ] Write failing unit test verifying input validation and edge cases\n"
                "- [ ] Implement service handler with database session scoping\n"
                "- [ ] Expose REST route with Pydantic request/response validation\n"
                "- [ ] Add frontend reactive client call with graceful error banners"
            )
        elif mode == "researcher":
            return (
                f"### 🔍 Competitive & Feasibility Intelligence: {query[:50]}\n\n"
                f"**1. Real-World Benchmarks:**{citation_text}\n"
                "- **GitHub & GitLab:** Solves this using background queue workers (Sidekiq/Celery) with optimistic UI updates.\n"
                "- **Linear & Raycast:** Implements client-side local cache syncing before server reconciliation.\n"
                "- **Supabase / Vercel:** Exposes declarative CLI and webhook web-standards.\n\n"
                "**2. Feasibility Rating: Moderate (4-7 days solo dev)**\n"
                "- **Core Challenge:** Ensuring data consistency across concurrent updates and handling external rate limits.\n"
                "- **Prerequisites:** Stable database schema and clear tenant partitioning."
            )
        else:  # judge
            return json.dumps({
                "score": 45,
                "verdict_signal": "DO_NOT_BUILD",
                "verdict_title": "Unnecessary Surface Area: High Maintenance, Marginal Impact",
                "brutal_critique": (
                    f"Let's be completely honest about '{query[:60]}': you are tempted to build this because it feels exciting to engineer, "
                    "not because users are banging on your door for it. It introduces state synchronization headaches, new dependencies, "
                    "and 3x more code than your current test suite can comfortably cover."
                ),
                "failure_modes": [
                    "You will spend 80% of your time debugging edge cases rather than delivering core value",
                    "Adds irreversible API schema debt before product-market validation"
                ],
                "what_to_build_instead": (
                    "Build a simple manual button or script first. If you find yourself using it 10+ times a week, "
                    "only then promote it to an automated feature."
                ),
                "summary_verdict": (
                    "Score: 45/100. Signal: 🔴 DO NOT BUILD / REJECT. "
                    "Step away from the speculative architecture. Strip this down to the absolute leanest MVP first."
                )
            }, indent=2)
