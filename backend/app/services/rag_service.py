import logging
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid5, NAMESPACE_DNS
from fastembed import TextEmbedding
from qdrant_client import models
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

from app.core.config import settings
from app.core.qdrant import get_qdrant_client, ensure_collection_exists

logger = logging.getLogger(__name__)

_embedder: Optional[TextEmbedding] = None


def get_embedder() -> TextEmbedding:
    """
    Lazy initialization of FastEmbed model (BAAI/bge-small-en-v1.5).
    Generates 384-dimensional dense vectors locally via ONNX Runtime with zero API billing.
    """
    global _embedder
    if _embedder is None:
        logger.info("[RAG] Loading FastEmbed model BAAI/bge-small-en-v1.5...")
        _embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    return _embedder


class RAGService:
    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        embedder = get_embedder()
        embeddings = list(embedder.embed([text]))
        return embeddings[0].tolist()

    @classmethod
    def get_embeddings(cls, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        embedder = get_embedder()
        return [e.tolist() for e in embedder.embed(texts)]

    @classmethod
    def make_point_id(cls, entity_type: str, entity_id: Any) -> str:
        return str(uuid5(NAMESPACE_DNS, f"{entity_type}:{str(entity_id)}"))

    @classmethod
    def index_project(cls, project: Any, user_id: Any) -> bool:
        """
        Indexes a repository / project into Qdrant Cloud.
        """
        client = get_qdrant_client()
        if not client:
            return False

        try:
            ensure_collection_exists(client)
            text_repr = (
                f"Project: {project.name}\n"
                f"Type: {getattr(project, 'project_type', '')}\n"
                f"Status: {getattr(project, 'status', '')}\n"
                f"Language: {getattr(project, 'primary_language', '') or 'General'}\n"
                f"Description: {getattr(project, 'description', '') or 'No description'}\n"
                f"Primary Goal: {getattr(project, 'goal', '') or 'Ship quality code'}"
            )

            vector = cls.get_embedding(text_repr)
            point_id = cls.make_point_id("project", project.id)

            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload={
                            "user_id": str(user_id),
                            "entity_type": "project",
                            "entity_id": str(project.id),
                            "project_id": str(project.id),
                            "title": project.name,
                            "content": text_repr,
                            "language": getattr(project, "primary_language", ""),
                            "status": str(getattr(project, "status", "")),
                        },
                    )
                ],
            )
            return True
        except Exception as e:
            logger.warning(f"[RAG] Failed to index project {project.id} in Qdrant: {e}")
            return False

    @classmethod
    def index_feature(cls, feature: Any, project_name: str, user_id: Any) -> bool:
        """
        Indexes a roadmap feature into Qdrant Cloud.
        """
        client = get_qdrant_client()
        if not client:
            return False

        try:
            ensure_collection_exists(client)
            text_repr = (
                f"Project: {project_name}\n"
                f"Feature: {feature.title}\n"
                f"Priority: {getattr(feature, 'priority', 'P1')}\n"
                f"Status: {getattr(feature, 'status', 'BACKLOG')}\n"
                f"Details: {getattr(feature, 'description', '') or 'No details'}"
            )

            vector = cls.get_embedding(text_repr)
            point_id = cls.make_point_id("feature", feature.id)

            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload={
                            "user_id": str(user_id),
                            "entity_type": "feature",
                            "entity_id": str(feature.id),
                            "project_id": str(feature.project_id) if hasattr(feature, "project_id") else None,
                            "project_name": project_name,
                            "title": feature.title,
                            "content": text_repr,
                            "priority": str(getattr(feature, "priority", "P1")),
                            "status": str(getattr(feature, "status", "BACKLOG")),
                        },
                    )
                ],
            )
            return True
        except Exception as e:
            logger.warning(f"[RAG] Failed to index feature {feature.id} in Qdrant: {e}")
            return False

    @classmethod
    def index_future_project(cls, idea: Any, user_id: Any) -> bool:
        """
        Indexes an incubator idea into Qdrant Cloud.
        """
        client = get_qdrant_client()
        if not client:
            return False

        try:
            ensure_collection_exists(client)
            text_repr = (
                f"Incubator Idea: {idea.title}\n"
                f"Target Stack: {getattr(idea, 'target_tech_stack', '') or 'Fullstack'}\n"
                f"Priority: {getattr(idea, 'priority', 'P1')}\n"
                f"Elevator Pitch: {getattr(idea, 'elevator_pitch', '') or ''}"
            )

            vector = cls.get_embedding(text_repr)
            point_id = cls.make_point_id("future_project", idea.id)

            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload={
                            "user_id": str(user_id),
                            "entity_type": "future_project",
                            "entity_id": str(idea.id),
                            "title": idea.title,
                            "content": text_repr,
                            "target_tech_stack": getattr(idea, "target_tech_stack", ""),
                        },
                    )
                ],
            )
            return True
        except Exception as e:
            logger.warning(f"[RAG] Failed to index incubator idea {idea.id} in Qdrant: {e}")
            return False

    @classmethod
    def delete_entity(cls, entity_type: str, entity_id: Any) -> bool:
        client = get_qdrant_client()
        if not client:
            return False
        try:
            point_id = cls.make_point_id(entity_type, entity_id)
            client.delete(
                collection_name=settings.QDRANT_COLLECTION,
                points_selector=models.PointIdsList(points=[point_id]),
            )
            return True
        except Exception as e:
            logger.warning(f"[RAG] Failed to delete point {point_id} from Qdrant: {e}")
            return False

    @classmethod
    def search_knowledge(
        cls,
        query: str,
        user_id: Any,
        project_id: Optional[Any] = None,
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Searches Qdrant Cloud using vector similarity with strict multi-tenant isolation.
        """
        client = get_qdrant_client()
        if not client:
            return []

        try:
            ensure_collection_exists(client)
            query_vector = cls.get_embedding(query)

            # Strict user isolation filter
            must_conditions = [
                FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))
            ]
            if project_id:
                must_conditions.append(
                    FieldCondition(key="project_id", match=MatchValue(value=str(project_id)))
                )

            filter_condition = Filter(must=must_conditions)

            # Qdrant client query points or search
            try:
                # Modern qdrant-client >= 1.9.0
                search_results = client.query_points(
                    collection_name=settings.QDRANT_COLLECTION,
                    query=query_vector,
                    query_filter=filter_condition,
                    limit=limit,
                ).points
            except AttributeError:
                search_results = client.search(
                    collection_name=settings.QDRANT_COLLECTION,
                    query_vector=query_vector,
                    query_filter=filter_condition,
                    limit=limit,
                )

            hits = []
            for hit in search_results:
                payload = hit.payload or {}
                hits.append({
                    "id": str(hit.id),
                    "score": round(float(hit.score), 3) if hasattr(hit, "score") and hit.score is not None else 0.0,
                    "title": payload.get("title", "Untitled Context"),
                    "entity_type": payload.get("entity_type", "general"),
                    "project_id": payload.get("project_id"),
                    "project_name": payload.get("project_name", payload.get("title")),
                    "content": payload.get("content", ""),
                })
            return hits
        except Exception as e:
            logger.warning(f"[RAG] Qdrant search encountered error: {e}")
            return []
