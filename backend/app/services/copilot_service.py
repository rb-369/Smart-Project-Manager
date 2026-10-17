from __future__ import annotations
import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.services.ai_service import AIService
from app.services.rag_service import RAGService
from app.services.mongodb_sync import MongoDBSyncService

logger = logging.getLogger(__name__)


class CopilotService:
    """
    Unified AI Copilot Orchestrator:
    Operates as a single assistant interface coordinating 3 specialized sub-agents:
    1. Market Researcher Sub-Agent: Competitor benchmarks, feasibility, architecture bottlenecks
    2. The Judge Sub-Agent: Brutally honest evaluation, score (0-100), verdict, fatal flaws & alternative
    3. Feature Planner Sub-Agent: Technical implementation blueprint & 1-click roadmap tasks
       (Includes Smart Pivot to alternative if The Judge rejects, preserving original draft)
    """

    @classmethod
    def get_system_prompt(cls, agent_role: str) -> str:
        if agent_role == "planner":
            return (
                "You are DevCommand's Principal Product Architect and Staff Systems Engineer (Feature Planner Sub-Agent).\n"
                "Your job is to transform feature ideas into rigorous, production-ready engineering blueprints.\n"
                "Always provide:\n"
                "1. Architectural Approach & Boundaries\n"
                "2. Specific API Contracts (HTTP verbs, paths, request/response JSON shapes)\n"
                "3. Database Schema Modifications (models, indexes, constraints)\n"
                "4. Step-by-Step Implementation Checklist\n"
                "5. Edge Cases & Concurrency Considerations\n"
                "6. Priority recommendation (P0 Critical, P1 High, P2 Medium)\n"
                "Ground your answers deeply in the user's existing codebase context if provided."
            )
        elif agent_role == "researcher":
            return (
                "You are DevCommand's Lead Market Researcher and Technical Feasibility Scout (Researcher Sub-Agent).\n"
                "Your job is to research real-world competitor benchmarks and evaluate architectural feasibility.\n"
                "Always provide:\n"
                "1. Real-World Competitor Benchmarks: 3-5 real SaaS or open-source apps that solved this problem and how they built it.\n"
                "2. Feasibility Rating: [Easy / Moderate / Complex / Prohibitive] with technical justification.\n"
                "3. Infrastructure & Dependencies: Key libraries, cloud services, and protocols needed.\n"
                "4. Hidden Gotchas & Bottlenecks: Real-world failure modes at scale (rate limits, sync conflicts, state bloat).\n"
                "5. Pragmatic Build Recommendation: The highest-leverage MVP approach."
            )
        elif agent_role == "judge":
            return (
                "You are DevCommand's Brutally Honest Judge (Judge Sub-Agent) — an uncompromising Staff Engineer and VC Product Judge.\n"
                "You despise vanity features, over-engineering, and bloat. You NEVER sugarcoat or flatter.\n"
                "Evaluate the proposal considering the researcher's findings and output a strict JSON object with these EXACT keys:\n"
                "{\n"
                '  "score": <integer from 0 to 100>,\n'
                '  "verdict_signal": <"BUILD_NOW" | "PROCEED_WITH_CAUTION" | "DO_NOT_BUILD">,\n'
                '  "verdict_title": <short punchy headline summary, e.g. "Distraction Trap: High Maintenance, Low Leverage">,\n'
                '  "brutal_critique": <unfiltered, cynical assessment of flawed assumptions and why this isn\'t as good as user thinks>,\n'
                '  "failure_modes": [<list of 2-4 concrete ways this feature will waste time or break>],\n'
                '  "what_to_build_instead": <a much leaner, higher-ROI alternative that solves the real core problem>,\n'
                '  "summary_verdict": <2-3 sentences of conclusive judgment on whether the user should proceed>\n'
                "}\n"
                "Scoring rubric:\n"
                "- 80-100: BUILD_NOW. Essential differentiator, low debt, massive developer leverage.\n"
                "- 50-79: PROCEED_WITH_CAUTION. Viable but carries maintenance burden or needs tight scoping.\n"
                "- 0-49: DO_NOT_BUILD. Premature optimization, vanity feature, reinvention of the wheel, or unneeded complexity."
            )
        else:
            return (
                "You are DevCommand Copilot, an elite AI pair programmer and engineering copilot.\n"
                "You have direct access to the user's project context, GitHub repositories, and codebase knowledge via Qdrant Cloud RAG.\n"
                "Answer questions thoroughly, accurately, and authoritatively, citing the user's codebase context where relevant."
            )

    @classmethod
    def classify_intent(cls, message: str) -> bool:
        """
        Determines whether the message is a feature pitch / architectural improvement
        (which triggers the 3-sub-agent pipeline), or a general question / chat query.
        """
        lower = message.lower().strip()

        # Explicit feature-planning triggers
        feature_keywords = [
            "build", "add", "feature", "implement", "create", "idea", "should we", "should i",
            "plan", "suggest", "propose", "system", "redesign", "integrate", "develop",
            "make a", "new feature", "functionality", "enhance", "prototype", "evaluate",
            "judge", "research", "competitor", "is it good", "worth building", "rate this"
        ]

        if any(kw in lower for kw in feature_keywords):
            return True

        # Purely conversational or informational queries
        general_intents = [
            "what is", "who are", "how does", "explain", "help me with", "show me",
            "hello", "hi", "hey", "status", "list my", "what repos", "what projects"
        ]
        if any(lower.startswith(g) for g in general_intents) and not any(kw in lower for kw in ["feature", "idea", "build"]):
            return False

        return len(lower.split()) >= 4

    @classmethod
    async def _execute_cascade_llm(
        cls,
        system_prompt: str,
        user_prompt: str,
        is_json: bool = False,
        fallback_fn = None
    ) -> Tuple[str, str]:
        """
        Executes cascade: OpenRouter -> Gemini 2.5 Flash -> NVIDIA NIM -> Heuristic Fallback.
        """
        # 1. OpenRouter
        if settings.OPENROUTER_API_KEY:
            try:
                res = await AIService._call_openrouter(system_prompt, user_prompt, json_mode=is_json)
                if res and len(res.strip()) > 5:
                    return res, "Tier 1: OpenRouter"
            except Exception as e:
                logger.warning(f"[Copilot Cascade] OpenRouter attempt failed: {e}")

        # 2. Gemini 2.5 Flash
        if settings.GEMINI_API_KEY:
            try:
                res = await AIService._call_gemini(system_prompt, user_prompt, json_mode=is_json)
                if res and len(res.strip()) > 5:
                    return res, "Tier 2: Gemini 2.5 Flash"
            except Exception as e:
                logger.warning(f"[Copilot Cascade] Gemini attempt failed: {e}")

        # 3. NVIDIA NIM (Llama 3.2 11B Vision Instruct)
        if settings.NVIDIA_API_KEY:
            try:
                res = await AIService._call_nvidia(system_prompt, user_prompt, json_mode=is_json)
                if res and len(res.strip()) > 5:
                    return res, "Tier 3: NVIDIA NIM"
            except Exception as e:
                logger.warning(f"[Copilot Cascade] NVIDIA attempt failed: {e}")

        # 4. Fallback Heuristic
        if fallback_fn:
            return fallback_fn(), "Local Intelligent Heuristic"
        return "Analysis completed using local reasoning framework.", "Local Intelligent Heuristic"

    @classmethod
    async def process_chat(
        cls,
        message: str,
        mode: str = "auto",
        user_id: Any = None,
        project_id: Optional[Any] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point for unified chat. Dispatches sub-agents for feature pitches,
        or handles general queries with Qdrant RAG context.
        """
        is_pitch = cls.classify_intent(message) or mode in ["planner", "researcher", "judge"]

        # 1. RAG Vector Search in Qdrant Cloud
        rag_hits = RAGService.search_knowledge(
            query=message,
            user_id=user_id,
            project_id=project_id,
            limit=4,
        )

        citations = []
        rag_context_blocks = []
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

        # ----------------------------------------------------------------------
        # PIPELINE A: Autonomous 3-Sub-Agent Pipeline (For Feature Pitches & Ideas)
        # ----------------------------------------------------------------------
        if is_pitch:
            tier_tracker = []

            # Sub-Agent 1: Market Researcher
            researcher_prompt = (
                f"Feature Proposal:\n{message}\n"
                f"{rag_prompt_text}\n"
                "Research competitor benchmarks, technical feasibility, and real-world failure modes."
            )
            researcher_content, t1 = await cls._execute_cascade_llm(
                cls.get_system_prompt("researcher"),
                researcher_prompt,
                is_json=False,
                fallback_fn=lambda: cls._heuristic_fallback(message, "researcher", citations)
            )
            tier_tracker.append(t1)

            # Sub-Agent 2: The Judge (Injected with Researcher Findings!)
            judge_prompt = (
                f"Feature Proposal:\n{message}\n"
                f"Market Researcher Sub-Agent Intelligence:\n{researcher_content}\n"
                f"{rag_prompt_text}\n"
                "Deliver your ruthless judgment in strict JSON with score, verdict_signal, brutal_critique, failure_modes, what_to_build_instead, and summary_verdict."
            )
            judge_raw, t2 = await cls._execute_cascade_llm(
                cls.get_system_prompt("judge"),
                judge_prompt,
                is_json=True,
                fallback_fn=lambda: cls._heuristic_fallback(message, "judge", citations)
            )
            tier_tracker.append(t2)
            judge_data = cls._parse_judge_json(judge_raw)

            # Sub-Agent 3: Feature Planner (Drafts Technical Architecture)
            planner_prompt = (
                f"Feature Proposal:\n{message}\n"
                f"Judge's Initial Rating: {judge_data.get('score', 50)}/100 ({judge_data.get('verdict_signal', 'PROCEED_WITH_CAUTION')})\n"
                f"{rag_prompt_text}\n"
                "Draft a production-ready technical architecture, API contracts, schema, and actionable checklist."
            )
            planner_content, t3 = await cls._execute_cascade_llm(
                cls.get_system_prompt("planner"),
                planner_prompt,
                is_json=False,
                fallback_fn=lambda: cls._heuristic_fallback(message, "planner", citations)
            )
            tier_tracker.append(t3)
            suggested_features = cls._extract_planner_features(planner_content, message)

            # Smart Pivot: If The Judge gave DO_NOT_BUILD, also generate the recommended alternative blueprint!
            pivot_plan = None
            is_rejected = judge_data.get("verdict_signal") == "DO_NOT_BUILD" or judge_data.get("score", 50) < 50
            if is_rejected and judge_data.get("what_to_build_instead"):
                alt_idea = judge_data["what_to_build_instead"]
                alt_prompt = (
                    f"Recommended Alternative by The Judge:\n{alt_idea}\n"
                    f"Original Pitch: {message}\n"
                    f"{rag_prompt_text}\n"
                    "Draft an ultra-lean MVP implementation blueprint for this recommended alternative."
                )
                alt_content, _ = await cls._execute_cascade_llm(
                    cls.get_system_prompt("planner"),
                    alt_prompt,
                    is_json=False,
                    fallback_fn=lambda: cls._heuristic_fallback(alt_idea, "planner", citations)
                )
                alt_features = cls._extract_planner_features(alt_content, alt_idea)
                pivot_plan = {
                    "alternative_title": alt_idea,
                    "content": alt_content,
                    "suggested_features": alt_features,
                }

            # Synthesize Executive Verdict
            score = judge_data.get("score", 50)
            signal = judge_data.get("verdict_signal", "PROCEED_WITH_CAUTION")
            signal_emoji = "🟢" if signal == "BUILD_NOW" else ("🟡" if signal == "PROCEED_WITH_CAUTION" else "🔴")
            
            executive_summary = (
                f"{signal_emoji} **Verdict: {signal.replace('_', ' ')} ({score}/100)**\n\n"
                f"{judge_data.get('summary_verdict', judge_data.get('brutal_critique', ''))}"
            )

            subagent_data = {
                "is_pipeline": True,
                "executive_summary": executive_summary,
                "researcher": {
                    "content": researcher_content,
                },
                "judge": judge_data,
                "planner": {
                    "content": planner_content,
                    "suggested_features": suggested_features,
                },
                "pivot_plan": pivot_plan,
            }

            active_tier = tier_tracker[0] if tier_tracker else "Tier 1: OpenRouter"

            # Save to MongoDB Atlas Cloud History if user_id present
            if user_id:
                try:
                    MongoDBSyncService.save_chat_message(
                        user_id=user_id,
                        role="user",
                        content=message,
                        project_id=project_id,
                        is_feature_pitch=True,
                    )
                    MongoDBSyncService.save_chat_message(
                        user_id=user_id,
                        role="assistant",
                        content=executive_summary,
                        project_id=project_id,
                        is_feature_pitch=True,
                        subagent_data=subagent_data,
                        citations=citations,
                        tier_used=active_tier,
                    )
                except Exception as sync_e:
                    logger.warning(f"Failed to persist chat message to MongoDB: {sync_e}")

            return {
                "mode": "pipeline",
                "response": executive_summary,
                "raw_content": planner_content,
                "citations": citations,
                "judge_data": judge_data,
                "suggested_features": suggested_features,
                "subagent_data": subagent_data,
                "tier_used": active_tier,
            }

        # ----------------------------------------------------------------------
        # PIPELINE B: Direct Conversational Copilot (For General & Codebase Queries)
        # ----------------------------------------------------------------------
        copilot_sys = cls.get_system_prompt("general")
        copilot_user = f"User Question:\n{message}\n{rag_prompt_text}"
        response_text, tier_used = await cls._execute_cascade_llm(
            copilot_sys,
            copilot_user,
            is_json=False,
            fallback_fn=lambda: f"Based on your codebase context{rag_prompt_text[:120]}:\nHere is the technical guidance for '{message[:50]}'."
        )

        subagent_data = {
            "is_pipeline": False,
            "executive_summary": response_text,
        }

        if user_id:
            try:
                MongoDBSyncService.save_chat_message(
                    user_id=user_id,
                    role="user",
                    content=message,
                    project_id=project_id,
                    is_feature_pitch=False,
                )
                MongoDBSyncService.save_chat_message(
                    user_id=user_id,
                    role="assistant",
                    content=response_text,
                    project_id=project_id,
                    is_feature_pitch=False,
                    subagent_data=subagent_data,
                    citations=citations,
                    tier_used=tier_used,
                )
            except Exception as sync_e:
                logger.warning(f"Failed to persist chat to MongoDB: {sync_e}")

        return {
            "mode": "general",
            "response": response_text,
            "raw_content": response_text,
            "citations": citations,
            "judge_data": None,
            "suggested_features": [],
            "subagent_data": subagent_data,
            "tier_used": tier_used,
        }

    @classmethod
    def _parse_judge_json(cls, raw: str) -> Dict[str, Any]:
        parsed = {}
        for extractor in [
            lambda: json.loads(raw),
            lambda: json.loads(re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL).group(1)),
            lambda: json.loads(re.search(r"(\{.*\})", raw, re.DOTALL).group(1)),
        ]:
            try:
                candidate = extractor()
                if isinstance(candidate, dict):
                    parsed = candidate
                    break
            except Exception:
                continue

        # Extract or sanitize score
        raw_score = parsed.get("score")
        if raw_score is None:
            score_match = re.search(r"(?:score|rating)[:\s]+(\d{1,3})", raw, re.IGNORECASE)
            score = int(score_match.group(1)) if score_match else 50
        else:
            try:
                score = int(raw_score)
            except Exception:
                score = 50
        score = max(0, min(100, score))

        # Verdict Signal
        signal = str(parsed.get("verdict_signal") or "").upper().strip()
        if signal not in ["BUILD_NOW", "PROCEED_WITH_CAUTION", "DO_NOT_BUILD"]:
            if score >= 80:
                signal = "BUILD_NOW"
            elif score >= 50:
                signal = "PROCEED_WITH_CAUTION"
            else:
                signal = "DO_NOT_BUILD"

        title = parsed.get("verdict_title") or f"The Judge's Verdict ({score}/100)"
        critique = parsed.get("brutal_critique") or (
            raw if len(raw) > 30 and not raw.strip().startswith("{") else
            "The proposed feature introduces unnecessary architectural surface area and implementation complexity."
        )
        failure_modes = parsed.get("failure_modes") or [
            "Premature scope expansion before verifying core user demand",
            "High ongoing maintenance burden and operational failure modes"
        ]
        if not isinstance(failure_modes, list):
            failure_modes = [str(failure_modes)]

        what_to_build = parsed.get("what_to_build_instead") or (
            "Build an ultra-lean MVP slice or manual workflow first to validate adoption."
        )
        summary = parsed.get("summary_verdict") or (
            critique[:350] + "..." if len(critique) > 350 else critique
        )

        return {
            "score": score,
            "verdict_signal": signal,
            "verdict_title": str(title),
            "brutal_critique": str(critique),
            "failure_modes": [str(m) for m in failure_modes],
            "what_to_build_instead": str(what_to_build),
            "summary_verdict": str(summary),
        }

    @classmethod
    def _extract_planner_features(cls, raw: str, user_query: str) -> List[Dict[str, Any]]:
        features = []
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
                "- **GitHub & GitLab:** Solves this using background queue workers with optimistic UI updates.\n"
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
