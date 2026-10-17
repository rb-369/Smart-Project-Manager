import json
import re
from typing import Dict, Any, Tuple
import httpx

from app.core.config import settings
from app.models.enums import ProjectType, FeaturePriority, FutureProjectPriority
from app.services.ai_prompts import (
    TRIAGE_SYSTEM_PROMPT,
    SUGGEST_FEATURES_SYSTEM_PROMPT,
    SUGGEST_PROJECTS_SYSTEM_PROMPT,
    PARSE_CONCEPT_SYSTEM_PROMPT,
)


def _clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Extract and parse clean JSON from markdown code blocks or raw text."""
    text = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


class AIService:
    @classmethod
    async def _call_openrouter(cls, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Tier: Call OpenRouter API with active free/available models."""
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not configured")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://smart-project-manager-em2i.onrender.com",
            "X-Title": "DevCommand",
            "Content-Type": "application/json",
        }
        models_to_try = [
            "liquid/lfm-2.5-2.6b:free",
            "meta-llama/llama-3.3-70b-instruct",
            "deepseek/deepseek-chat",
        ]
        last_err = None
        async with httpx.AsyncClient(timeout=10.0) as client:
            for model_slug in models_to_try:
                payload: Dict[str, Any] = {
                    "model": model_slug,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
                    last_err = f"OpenRouter ({model_slug}) returned {resp.status_code}: {resp.text}"
                except Exception as e:
                    last_err = f"OpenRouter ({model_slug}) exception: {e}"
        raise RuntimeError(last_err or "OpenRouter all models failed")

    @classmethod
    async def _call_gemini(cls, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Tier: Call Google Gemini REST API (Gemini 2.5 Flash)."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
            f"?key={settings.GEMINI_API_KEY}"
        )
        combined_prompt = f"{system_prompt}\n\nTask:\n{user_prompt}"
        if json_mode:
            combined_prompt += "\n\nReturn strict JSON only."
        gen_config: Dict[str, Any] = {"temperature": 0.2}
        if json_mode:
            gen_config["responseMimeType"] = "application/json"

        payload = {
            "contents": [{"parts": [{"text": combined_prompt}]}],
            "generationConfig": gen_config,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini returned {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    @classmethod
    async def _call_nvidia(cls, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Tier: Call NVIDIA NIM API (Llama 3.2 11B Vision Instruct)."""
        if not settings.NVIDIA_API_KEY:
            raise ValueError("NVIDIA_API_KEY not configured")

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": "meta/llama-3.2-11b-vision-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"NVIDIA returned {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @classmethod
    async def execute_cascade(
        cls, system_prompt: str, user_prompt: str, fallback_generator
    ) -> Tuple[Dict[str, Any], str]:
        """Execute the 3-tier cascade: OpenRouter -> Gemini -> NVIDIA -> Heuristic Fallback."""
        # 1. Try OpenRouter
        try:
            content = await cls._call_openrouter(system_prompt, user_prompt, json_mode=True)
            return _clean_json_response(content), "openrouter"
        except Exception:
            pass

        # 2. Try Gemini (Gemini 2.5 Flash)
        try:
            content = await cls._call_gemini(system_prompt, user_prompt, json_mode=True)
            return _clean_json_response(content), "gemini"
        except Exception:
            pass

        # 3. Try NVIDIA (Llama 3.2 11B Vision Instruct)
        try:
            content = await cls._call_nvidia(system_prompt, user_prompt, json_mode=True)
            return _clean_json_response(content), "nvidia"
        except Exception:
            pass

        # 4. Graceful Heuristic Fallback
        return fallback_generator(), "heuristic_offline"

    @classmethod
    async def triage_repository(
        cls,
        repo_name: str,
        description: str | None,
        language: str | None,
        readme: str | None,
    ) -> Tuple[Dict[str, Any], str]:
        """Classify repository and suggest goal & initial features."""
        user_prompt = f"""Repository Name: {repo_name}
Description: {description or 'None provided'}
Primary Language: {language or 'Unknown'}
README Snippet:
{readme or 'No README content'}
"""

        def heuristic_fallback() -> Dict[str, Any]:
            name_lower = repo_name.lower()
            if any(k in name_lower for k in ["lab", "assignment", "course", "college", "hw", "exam"]):
                p_type = ProjectType.COLLEGE
                goal = f"Complete all academic requirements and test suites for {repo_name}."
            elif any(k in name_lower for k in ["saas", "prod", "api", "cloud", "payment"]):
                p_type = ProjectType.PRODUCTION
                goal = f"Deploy production-ready {repo_name} with robust auth, database, and telemetry."
            else:
                p_type = ProjectType.RESUME
                goal = f"Build and showcase a portfolio-grade {repo_name} application."

            features = [
                {"title": "Core Architecture & Data Modeling", "description": "Set up core schema and persistence layer.", "priority": "P0"},
                {"title": "User Authentication & Permissions", "description": "Implement secure authentication flow.", "priority": "P1"},
                {"title": "Automated Unit & Integration Tests", "description": "Write automated test coverage for critical paths.", "priority": "P1"},
                {"title": "Deployment Pipeline & Dockerfile", "description": "Containerize app for repeatable cloud deployment.", "priority": "P2"},
            ]
            return {
                "suggested_project_type": p_type.value,
                "suggested_goal": goal,
                "suggested_initial_features": features,
            }

        return await cls.execute_cascade(TRIAGE_SYSTEM_PROMPT, user_prompt, heuristic_fallback)

    @classmethod
    async def suggest_next_features(
        cls,
        project_name: str,
        project_type: str,
        goal: str | None,
        tech_stack: str | None,
        existing_features: list[dict],
    ) -> Tuple[Dict[str, Any], str]:
        """Suggest 3 to 5 high-impact next features given project goal."""
        completed_features = [f["title"] for f in existing_features if f.get("status") == "DONE"]
        pending_features = [f["title"] for f in existing_features if f.get("status") != "DONE"]

        user_prompt = f"""Project Name: {project_name}
Project Classification: {project_type}
Primary Goal: {goal or 'Build a high-quality application'}
Tech Stack / Language: {tech_stack or 'General'}
Already Completed Features: {completed_features or 'None yet'}
Currently In Backlog: {pending_features or 'None'}
"""

        def heuristic_fallback() -> Dict[str, Any]:
            features = [
                {
                    "title": "Comprehensive E2E Verification Suite",
                    "description": "Add end-to-end user scenario tests to prevent regressions.",
                    "priority": "P1",
                    "rationale": "Ensures stability as you advance towards the project's goal.",
                },
                {
                    "title": "Dark Mode & Responsive UI Polish",
                    "description": "Refine interface ergonomics for desktop and mobile screen sizes.",
                    "priority": "P2",
                    "rationale": "Creates an immediate impression of polish and craftsmanship.",
                },
                {
                    "title": "Performance Optimization & Caching",
                    "description": "Cache frequent queries and optimize render lifecycles.",
                    "priority": "P2",
                    "rationale": "Guarantees snappy sub-100ms response times.",
                },
            ]
            return {"features": features}

        return await cls.execute_cascade(SUGGEST_FEATURES_SYSTEM_PROMPT, user_prompt, heuristic_fallback)

    @classmethod
    async def suggest_next_projects(
        cls, existing_projects: list[dict]
    ) -> Tuple[Dict[str, Any], str]:
        """Suggest 3 new project concepts based on existing portfolio."""
        summaries = [f"{p['name']} ({p.get('primary_language', 'General')}) - {p.get('project_type', 'RESUME')}" for p in existing_projects]

        user_prompt = f"""Existing Projects Portfolio:
{chr(10).join(summaries) if summaries else 'No existing projects yet.'}
"""

        def heuristic_fallback() -> Dict[str, Any]:
            projects = [
                {
                    "title": "Realtime Collaborative Canvas",
                    "elevator_pitch": "Interactive visual workspace powered by WebSockets and CRDTs for multiplayer sync.",
                    "target_tech_stack": "Next.js + FastAPI + WebSockets",
                    "project_type": "RESUME",
                    "priority": "P0",
                    "why_this_project": "Demonstrates complex state synchronization and high-performance frontend engineering.",
                },
                {
                    "title": "Edge Telemetry & Log Aggregator",
                    "elevator_pitch": "Lightweight event collector with real-time anomaly detection and alert dispatch.",
                    "target_tech_stack": "Python + SQLite + Flutter Mobile",
                    "project_type": "PRODUCTION",
                    "priority": "P1",
                    "why_this_project": "Shows system architecture, background processing, and mobile monitoring skills.",
                },
                {
                    "title": "Developer Knowledge Graph Engine",
                    "elevator_pitch": "CLI tool that turns Git commits and Markdown notes into an explorable interactive graph.",
                    "target_tech_stack": "Python + TypeScript",
                    "project_type": "RESUME",
                    "priority": "P2",
                    "why_this_project": "High utility developer tool that showcases graph algorithms and CLI UX design.",
                },
            ]
            return {"projects": projects}

        return await cls.execute_cascade(SUGGEST_PROJECTS_SYSTEM_PROMPT, user_prompt, heuristic_fallback)

    @classmethod
    async def parse_raw_concept(cls, raw_text: str) -> Tuple[Dict[str, Any], str]:
        """Parse raw conversational text (e.g. WhatsApp messages, quick voice notes) into structured concept."""
        user_prompt = f"""Raw Idea Text / WhatsApp Message:
\"\"\"{raw_text.strip()}\"\"\"

Analyze this text and extract:
1. title (punchy, clean, professional)
2. elevator_pitch (1-2 sentences on what it does and why it matters)
3. target_tech_stack (recommended modern tech stack, e.g. 'Python, FastAPI, Redis, React')
4. project_type ('RESUME', 'COLLEGE', or 'PRODUCTION')
5. priority ('P0', 'P1', or 'P2')
6. starter_features (array of 3 to 4 concrete MVP bullet features)
7. notes (clean formatted summary with original highlights and starter checklist)
"""

        def heuristic_fallback() -> Dict[str, Any]:
            clean = raw_text.strip()
            # Clean unwanted quotes or conversational prefixes
            clean_first = clean.split("\n")[0][:80]
            words = [w for w in re.findall(r"\b[A-Za-z0-9+#.-]+\b", clean_first) if len(w) > 2]
            title = " ".join(words[:4]).title() if words else "Smart Idea Concept"

            # Detect tech keywords in raw text
            detected_tech = []
            tech_keywords = [
                "python", "fastapi", "flask", "django", "react", "next.js", "nextjs", 
                "vue", "svelte", "node", "express", "typescript", "docker", "kubernetes",
                "postgres", "postgresql", "mongodb", "sqlite", "redis", "tailwind",
                "flutter", "go", "golang", "rust", "c++", "aws", "vercel", "gemini",
                "openai", "llm", "telegram", "whatsapp", "supabase", "firebase"
            ]
            lower_clean = clean.lower()
            for kw in tech_keywords:
                if kw in lower_clean:
                    name = kw.title() if len(kw) > 3 else kw.upper()
                    if name not in detected_tech:
                        detected_tech.append(name)

            tech_stack = ", ".join(detected_tech) if detected_tech else "Python, FastAPI, React, SQLite"

            # Detect priority keywords
            priority = "P1"
            if any(k in lower_clean for k in ["urgent", "p0", "asap", "immediate", "top priority", "high priority", "critical"]):
                priority = "P0"
            elif any(k in lower_clean for k in ["later", "p2", "backlog", "future", "someday", "low priority", "research"]):
                priority = "P2"

            # Detect project type
            p_type = "RESUME"
            if any(k in lower_clean for k in ["saas", "production", "client", "business", "stripe", "billing", "revenue"]):
                p_type = "PRODUCTION"
            elif any(k in lower_clean for k in ["college", "assignment", "lab", "thesis", "research", "exam", "university"]):
                p_type = "COLLEGE"

            # Clean elevator pitch
            pitch = clean[:250].replace("\n", " ").strip()
            if len(clean) > 250:
                pitch += "..."

            return {
                "title": title,
                "elevator_pitch": pitch,
                "target_tech_stack": tech_stack,
                "project_type": p_type,
                "priority": priority,
                "starter_features": [
                    "Core Data Schema & Architecture Setup",
                    "Primary User Flow & Interactive UI",
                    "API Integration & Business Logic",
                    "Automated Testing & Deployment Configuration",
                ],
                "notes": f"Raw WhatsApp Notes:\n{clean}",
            }

        return await cls.execute_cascade(PARSE_CONCEPT_SYSTEM_PROMPT, user_prompt, heuristic_fallback)

