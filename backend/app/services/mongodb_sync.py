import logging
from typing import Any, Dict
from app.core.mongodb import get_mongodb_database, is_mongodb_configured
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.future_project import FutureProject
from app.models.ai_log import AILog

logger = logging.getLogger("devcommand.mongodb_sync")


class MongoDBSyncService:
    """Service to mirror data to MongoDB Atlas collections for persistent document storage."""

    @staticmethod
    def sync_user(user: User):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            doc = {
                "_id": str(user.id),
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "github_username": user.github_username,
                "avatar_url": user.avatar_url,
                "has_github_token": bool(user.encrypted_github_token),
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
            db.users.update_one({"_id": str(user.id)}, {"$set": doc}, upsert=True)
        except Exception as e:
            logger.warning(f"Error syncing user {user.id} to MongoDB Atlas: {e}")

    @staticmethod
    def sync_project(project: Project):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            doc = {
                "_id": str(project.id),
                "id": str(project.id),
                "user_id": str(project.user_id),
                "github_repo_id": project.github_repo_id,
                "name": project.name,
                "description": project.description,
                "html_url": project.html_url,
                "primary_language": project.primary_language,
                "stars_count": project.stars_count,
                "forks_count": project.forks_count,
                "default_branch": project.default_branch,
                "project_type": project.project_type.value if hasattr(project.project_type, "value") else str(project.project_type),
                "status": project.status.value if hasattr(project.status, "value") else str(project.status),
                "goal": project.goal,
                "needs_review": project.needs_review,
                "manual_progress_override": project.manual_progress_override,
                "use_manual_progress": project.use_manual_progress,
                "created_at": project.created_at,
                "updated_at": project.updated_at,
            }
            db.projects.update_one({"_id": str(project.id)}, {"$set": doc}, upsert=True)
        except Exception as e:
            logger.warning(f"Error syncing project {project.id} to MongoDB Atlas: {e}")

        # Trigger RAG vectorization
        try:
            from app.services.rag_service import RAGService
            RAGService.index_project(project, project.user_id)
        except Exception:
            pass

    @staticmethod
    def delete_project(project_id: Any):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            db.projects.delete_one({"_id": str(project_id)})
            db.features.delete_many({"project_id": str(project_id)})
        except Exception as e:
            logger.warning(f"Error deleting project {project_id} from MongoDB Atlas: {e}")

    @staticmethod
    def sync_feature(feature: Feature):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            doc = {
                "_id": str(feature.id),
                "id": str(feature.id),
                "project_id": str(feature.project_id),
                "title": feature.title,
                "description": feature.description,
                "priority": feature.priority.value if hasattr(feature.priority, "value") else str(feature.priority),
                "status": feature.status.value if hasattr(feature.status, "value") else str(feature.status),
                "order_index": feature.order_index,
                "completed_at": feature.completed_at,
                "created_at": feature.created_at,
                "updated_at": feature.updated_at,
            }
            db.features.update_one({"_id": str(feature.id)}, {"$set": doc}, upsert=True)
        except Exception as e:
            logger.warning(f"Error syncing feature {feature.id} to MongoDB Atlas: {e}")

    @staticmethod
    def delete_feature(feature_id: Any):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            db.features.delete_one({"_id": str(feature_id)})
        except Exception as e:
            logger.warning(f"Error deleting feature {feature_id} from MongoDB Atlas: {e}")

    @staticmethod
    def sync_future_project(idea: FutureProject):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            doc = {
                "_id": str(idea.id),
                "id": str(idea.id),
                "user_id": str(idea.user_id),
                "title": idea.title,
                "elevator_pitch": idea.elevator_pitch,
                "target_tech_stack": idea.target_tech_stack,
                "project_type": idea.project_type.value if hasattr(idea.project_type, "value") else str(idea.project_type),
                "priority": idea.priority.value if hasattr(idea.priority, "value") else str(idea.priority),
                "status": idea.status.value if hasattr(idea.status, "value") else str(idea.status),
                "notes": idea.notes,
                "promoted_project_id": str(idea.promoted_project_id) if idea.promoted_project_id else None,
                "created_at": idea.created_at,
                "updated_at": idea.updated_at,
            }
            db.future_projects.update_one({"_id": str(idea.id)}, {"$set": doc}, upsert=True)
        except Exception as e:
            logger.warning(f"Error syncing future project {idea.id} to MongoDB Atlas: {e}")

        # Trigger RAG vectorization
        try:
            from app.services.rag_service import RAGService
            RAGService.index_future_project(idea, idea.user_id)
        except Exception:
            pass

    @staticmethod
    def delete_future_project(idea_id: Any):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            db.future_projects.delete_one({"_id": str(idea_id)})
        except Exception as e:
            logger.warning(f"Error deleting future project {idea_id} from MongoDB Atlas: {e}")

    @staticmethod
    def sync_ai_log(ai_log: AILog):
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return
        try:
            doc = {
                "_id": str(ai_log.id),
                "id": str(ai_log.id),
                "user_id": str(ai_log.user_id),
                "project_id": str(ai_log.project_id) if ai_log.project_id else None,
                "recommendation_type": ai_log.recommendation_type.value if hasattr(ai_log.recommendation_type, "value") else str(ai_log.recommendation_type),
                "provider_used": ai_log.provider_used,
                "response_payload": ai_log.response_payload,
                "created_at": ai_log.created_at,
            }
            db.ai_logs.update_one({"_id": str(ai_log.id)}, {"$set": doc}, upsert=True)
        except Exception as e:
            logger.warning(f"Error syncing ai log {ai_log.id} to MongoDB Atlas: {e}")
