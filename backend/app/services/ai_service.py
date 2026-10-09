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
    async def _call_openrouter(cls, system_prompt: str, user_prompt: str) -> str:
        """Tier 1: Call OpenRouter API with free tier models."""
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not configured")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "DevCommand",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"OpenRouter returned {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @classmethod
    async def _call_gemini(cls, system_prompt: str, user_prompt: str) -> str:
        """Tier 2 (Fallback 1): Call Google Gemini REST API."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
            f"?key={settings.GEMINI_API_KEY}"
        )
        combined_prompt = f"{system_prompt}\n\nTask:\n{user_prompt}\n\nReturn strict JSON only."
        payload = {
            "contents": [{"parts": [{"text": combined_prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini returned {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    @classmethod
    async def _call_nvidia(cls, system_prompt: str, user_prompt: str) -> str:
        """Tier 3 (Fallback 2): Call NVIDIA NIM API."""
        if not settings.NVIDIA_API_KEY:
            raise ValueError("NVIDIA_API_KEY not configured")

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
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
            content = await cls._call_openrouter(system_prompt, user_prompt)
            return _clean_json_response(content), "openrouter"
        except Exception:
            pass

        # 2. Try Gemini
        try:
            content = await cls._call_gemini(system_prompt, user_prompt)
            return _clean_json_response(content), "gemini"
        except Exception:
            pass

        # 3. Try NVIDIA
        try:
            content = await cls._call_nvidia(system_prompt, user_prompt)
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
