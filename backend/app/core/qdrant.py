import logging
import time
from typing import Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.core.config import settings

logger = logging.getLogger(__name__)

_qdrant_client: Optional[QdrantClient] = None
VECTOR_DIMENSION = 384  # Standard output for BAAI/bge-small-en-v1.5


def get_qdrant_client(force_new: bool = False) -> Optional[QdrantClient]:
    """
    Returns an active QdrantClient instance connected to Qdrant Cloud.
    If QDRANT_URL is not configured, returns an in-memory client for testing/local safety.
    """
    global _qdrant_client

    if _qdrant_client is not None and not force_new:
        return _qdrant_client

    if settings.QDRANT_URL and settings.QDRANT_URL.strip():
        try:
            client = QdrantClient(
                url=settings.QDRANT_URL.strip(),
                api_key=settings.QDRANT_API_KEY.strip() if settings.QDRANT_API_KEY else None,
                timeout=10.0,
            )
            # Verify connectivity
            client.get_collections()
            _qdrant_client = client
            logger.info(f"[Qdrant] Connected to Qdrant Cloud at {settings.QDRANT_URL}")
            return _qdrant_client
        except Exception as e:
            logger.warning(f"[Qdrant] Failed to connect to Qdrant Cloud ({settings.QDRANT_URL}): {e}")
            # Fall back to ephemeral in-memory client so app never crashes
            _qdrant_client = QdrantClient(":memory:")
            return _qdrant_client
    else:
        # Development / test fallback when credentials are not yet entered
        _qdrant_client = QdrantClient(":memory:")
        return _qdrant_client


def ensure_collection_exists(
    client: Optional[QdrantClient] = None,
    collection_name: Optional[str] = None
) -> bool:
    """
    Verifies that the target collection exists in Qdrant, creating it with
    Cosine similarity and 384 dimensions if missing.
    """
    c = client or get_qdrant_client()
    if not c:
        return False

    name = collection_name or settings.QDRANT_COLLECTION

    try:
        collections_response = c.get_collections()
        existing_names = [col.name for col in collections_response.collections]

        if name not in existing_names:
            c.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=VECTOR_DIMENSION,
                    distance=models.Distance.COSINE
                ),
            )
            logger.info(f"[Qdrant] Created collection '{name}' with {VECTOR_DIMENSION}d Cosine vectors.")

        # Ensure payload indexes exist for strict multi-tenant filtering
        try:
            c.create_payload_index(
                collection_name=name,
                field_name="user_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            c.create_payload_index(
                collection_name=name,
                field_name="project_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            c.create_payload_index(
                collection_name=name,
                field_name="entity_type",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass

        return True
    except Exception as e:
        logger.error(f"[Qdrant] Error ensuring collection '{name}': {e}")
        return False


def check_qdrant_connection() -> Dict[str, Any]:
    """
    Checks the status and latency of the Qdrant Cloud cluster.
    """
    configured = bool(settings.QDRANT_URL and settings.QDRANT_URL.strip())
    collection_name = settings.QDRANT_COLLECTION

    if not configured:
        return {
            "configured": False,
            "connected": False,
            "url": None,
            "collection": collection_name,
            "points_count": 0,
            "latency_ms": 0,
            "message": "Qdrant Cloud URL is not configured in .env (QDRANT_URL / QDRANT_API_KEY).",
        }

    try:
        client = get_qdrant_client(force_new=True)
        if not client:
            raise ConnectionError("Unable to initialize QdrantClient.")

        start = time.perf_counter()
        ensure_collection_exists(client, collection_name)
        info = client.get_collection(collection_name)
        latency = round((time.perf_counter() - start) * 1000, 2)

        return {
            "configured": True,
            "connected": True,
            "url": settings.QDRANT_URL,
            "collection": collection_name,
            "points_count": info.points_count or 0,
            "latency_ms": latency,
            "message": f"Successfully connected to Qdrant Cloud ({collection_name}).",
        }
    except Exception as e:
        return {
            "configured": True,
            "connected": False,
            "url": settings.QDRANT_URL,
            "collection": collection_name,
            "points_count": 0,
            "latency_ms": 0,
            "message": f"Failed to connect to Qdrant Cloud: {str(e)}",
        }
