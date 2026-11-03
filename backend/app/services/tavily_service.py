from __future__ import annotations
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TAVILY_API_URL = "https://api.tavily.com/search"


class TavilyService:
    """
    Tavily AI Search Engine Service:
    Provides live internet search, competitor intelligence, and real-time web grounding
    for DevCommand autonomous agents (Market Researcher, The Judge, and Copilot).
    """

    @classmethod
    def is_configured(cls) -> bool:
        """Returns True if a non-empty TAVILY_API_KEY is configured in settings."""
        api_key = getattr(settings, "TAVILY_API_KEY", "") or ""
        return bool(api_key.strip())

    @classmethod
    async def search(
        cls,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_answer: bool = True,
        include_raw_content: bool = False,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an asynchronous web search via Tavily API.
        
        Returns:
            Dict with keys:
            - 'query': str
            - 'answer': Optional[str]
            - 'results': List[Dict[str, Any]] (title, url, content, score)
            - 'latency_ms': float
            - 'success': bool
            - 'error': Optional[str]
        """
        if not cls.is_configured():
            logger.info("[Tavily] TAVILY_API_KEY not configured. Skipping internet search.")
            return {
                "query": query,
                "answer": None,
                "results": [],
                "latency_ms": 0.0,
                "success": False,
                "error": "TAVILY_API_KEY is not configured in .env",
            }

        api_key = settings.TAVILY_API_KEY.strip()
        payload: Dict[str, Any] = {
            "api_key": api_key,
            "query": query,
            "search_depth": search_depth or getattr(settings, "TAVILY_SEARCH_DEPTH", "basic"),
            "include_answer": include_answer,
            "max_results": max(1, min(max_results, 10)),
            "include_raw_content": include_raw_content,
        }

        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    TAVILY_API_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                latency_ms = round((time.time() - start_time) * 1000, 1)

                if response.status_code == 200:
                    data = response.json()
                    results = []
                    for item in data.get("results", []):
                        results.append({
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "content": item.get("content", ""),
                            "score": item.get("score", 0.0),
                        })

                    return {
                        "query": query,
                        "answer": data.get("answer"),
                        "results": results,
                        "latency_ms": latency_ms,
                        "success": True,
                        "error": None,
                    }
                else:
                    err_msg = f"Tavily API responded with status {response.status_code}: {response.text[:200]}"
                    logger.warning(f"[Tavily Search Error] {err_msg}")
                    return {
                        "query": query,
                        "answer": None,
                        "results": [],
                        "latency_ms": latency_ms,
                        "success": False,
                        "error": err_msg,
                    }

        except httpx.TimeoutException:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            logger.warning(f"[Tavily Search] Timeout after {latency_ms}ms for query: {query[:60]}")
            return {
                "query": query,
                "answer": None,
                "results": [],
                "latency_ms": latency_ms,
                "success": False,
                "error": "Tavily search request timed out.",
            }
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            logger.error(f"[Tavily Search Exception] {e}")
            return {
                "query": query,
                "answer": None,
                "results": [],
                "latency_ms": latency_ms,
                "success": False,
                "error": str(e),
            }

    @classmethod
    async def get_search_context(
        cls,
        query: str,
        max_results: int = 4,
        search_depth: str = "basic"
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Executes a Tavily search and formats the results into an LLM-friendly prompt block
        and a list of web source citations.
        
        Returns:
            Tuple[formatted_prompt_block: str, web_sources: List[Dict[str, Any]]]
        """
        if not cls.is_configured():
            return "", []

        search_res = await cls.search(
            query=query,
            search_depth=search_depth,
            max_results=max_results,
            include_answer=True,
        )

        if not search_res.get("success") or not search_res.get("results"):
            return "", []

        lines = [
            "\n--- LIVE INTERNET INTELLIGENCE (GROUNDED VIA TAVILY AI SEARCH) ---",
            f"Search Query: {query}",
        ]

        if search_res.get("answer"):
            lines.append(f"Synthesized Web Answer: {search_res['answer']}\n")

        lines.append("Top Verified Web Precedents & Sources:")
        web_sources = []
        for idx, item in enumerate(search_res["results"], 1):
            title = item.get("title", "Untitled Source")
            url = item.get("url", "")
            content = item.get("content", "").strip()
            score = item.get("score", 0.0)

            web_sources.append({
                "title": title,
                "url": url,
                "snippet": content[:240],
                "score": score,
                "source": "tavily",
            })

            lines.append(f"{idx}. [{title}]({url})")
            if content:
                lines.append(f"   Excerpt: {content[:300]}")

        lines.append("--- END LIVE INTERNET INTELLIGENCE ---\n")
        return "\n".join(lines), web_sources

    @classmethod
    async def check_tavily_status(cls) -> Dict[str, Any]:
        """
        Checks real-time connectivity and configuration of Tavily Search Engine.
        """
        if not cls.is_configured():
            return {
                "configured": False,
                "connected": False,
                "latency_ms": 0.0,
                "message": "TAVILY_API_KEY is not configured in .env. Live internet search is inactive.",
            }

        start_time = time.time()
        try:
            # Lightweight ping / test search
            res = await cls.search(query="DevCommand", max_results=1, search_depth="basic")
            latency_ms = res.get("latency_ms", round((time.time() - start_time) * 1000, 1))

            if res.get("success"):
                return {
                    "configured": True,
                    "connected": True,
                    "latency_ms": latency_ms,
                    "message": f"Tavily AI Search Engine online ({latency_ms}ms). Live internet grounding active.",
                }
            else:
                return {
                    "configured": True,
                    "connected": False,
                    "latency_ms": latency_ms,
                    "message": f"Tavily API key provided but search check failed: {res.get('error')}",
                }
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 1)
            return {
                "configured": True,
                "connected": False,
                "latency_ms": latency_ms,
                "message": f"Tavily check failed: {e}",
            }

