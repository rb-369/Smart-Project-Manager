import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.tavily_service import TavilyService
from app.services.copilot_service import CopilotService


def test_tavily_service_is_configured():
    """Verify is_configured reflects settings.TAVILY_API_KEY accurately."""
    with patch.object(settings, "TAVILY_API_KEY", ""):
        assert TavilyService.is_configured() is False

    with patch.object(settings, "TAVILY_API_KEY", "tvly-test-12345"):
        assert TavilyService.is_configured() is True


@pytest.mark.asyncio
async def test_tavily_search_not_configured():
    """Verify graceful handling when TAVILY_API_KEY is not configured."""
    with patch.object(settings, "TAVILY_API_KEY", ""):
        res = await TavilyService.search("FastAPI scalability benchmarks")
        assert res["success"] is False
        assert "not configured" in res["error"]
        assert res["results"] == []


@pytest.mark.asyncio
async def test_tavily_search_success_mock():
    """Verify Tavily search response parsing and data extraction."""
    mock_response_data = {
        "query": "FastAPI WebAuthn biometric passkeys",
        "answer": "FastAPI supports biometric WebAuthn via py_webauthn and fast_fido2.",
        "results": [
            {
                "title": "py_webauthn - Python WebAuthn Implementation",
                "url": "https://github.com/duo-labs/py_webauthn",
                "content": "A Python implementation of the WebAuthn standard for passwordless authentication.",
                "score": 0.98,
            },
            {
                "title": "FastAPI Passwordless Authentication with Passkeys",
                "url": "https://example.com/fastapi-passkeys",
                "content": "Step-by-step tutorial on integrating FIDO2 WebAuthn in FastAPI.",
                "score": 0.91,
            }
        ]
    }

    with patch.object(settings, "TAVILY_API_KEY", "tvly-mock-key"):
        with patch("httpx.AsyncClient.post") as mock_post:
            mock_post.return_value = AsyncMock(
                status_code=200,
                json=lambda: mock_response_data,
            )

            res = await TavilyService.search("FastAPI WebAuthn biometric passkeys")
            assert res["success"] is True
            assert res["answer"] == mock_response_data["answer"]
            assert len(res["results"]) == 2
            assert res["results"][0]["title"] == "py_webauthn - Python WebAuthn Implementation"
            assert res["results"][0]["url"] == "https://github.com/duo-labs/py_webauthn"


@pytest.mark.asyncio
async def test_tavily_get_search_context_formatting():
    """Verify formatting of search results into an LLM-friendly prompt block and citations."""
    mock_response_data = {
        "query": "FastAPI Kafka microservices",
        "answer": "FastStream and aiokafka are standard for Kafka with FastAPI.",
        "results": [
            {
                "title": "FastStream Kafka Framework",
                "url": "https://github.com/airtai/faststream",
                "content": "FastStream is a powerful Python framework for message brokers.",
                "score": 0.95,
            }
        ]
    }

    with patch.object(settings, "TAVILY_API_KEY", "tvly-mock-key"):
        with patch.object(TavilyService, "search", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = {
                "success": True,
                "answer": mock_response_data["answer"],
                "results": mock_response_data["results"],
            }

            text, web_sources = await TavilyService.get_search_context("FastAPI Kafka microservices")
            assert "LIVE INTERNET INTELLIGENCE" in text
            assert "FastStream Kafka Framework" in text
            assert "https://github.com/airtai/faststream" in text
            assert len(web_sources) == 1
            assert web_sources[0]["title"] == "FastStream Kafka Framework"
            assert web_sources[0]["url"] == "https://github.com/airtai/faststream"


@pytest.mark.asyncio
async def test_tavily_check_status():
    """Verify check_tavily_status output schemas."""
    # When not configured:
    with patch.object(settings, "TAVILY_API_KEY", ""):
        status_unconf = await TavilyService.check_tavily_status()
        assert status_unconf["configured"] is False
        assert status_unconf["connected"] is False

    # When configured and reachable:
    with patch.object(settings, "TAVILY_API_KEY", "tvly-active-key"):
        with patch.object(TavilyService, "search", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = {"success": True, "latency_ms": 115.0}
            status_conf = await TavilyService.check_tavily_status()
            assert status_conf["configured"] is True
            assert status_conf["connected"] is True


def test_copilot_service_resolves_search_skill():
    """Verify that CopilotService resolves /search and natural language triggers."""
    # Slash skill:
    skill, clean = CopilotService.resolve_skill("/search Next.js 16 partial prerendering")
    assert skill == "search"
    assert clean == "Next.js 16 partial prerendering"

    # Natural language web search trigger:
    skill, clean = CopilotService.resolve_skill("search the web for LangGraph vs CrewAI")
    assert skill == "search"
    assert "LangGraph vs CrewAI" in clean

    # Mode argument override:
    skill, clean = CopilotService.resolve_skill("any text", mode="search")
    assert skill == "search"
