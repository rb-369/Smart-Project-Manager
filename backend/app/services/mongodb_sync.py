from __future__ import annotations
import logging
from typing import Any, Dict, Optional, List
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
            update_data = {
                "email": user.email.lower().strip(),
                "full_name": user.full_name,
                "github_username": user.github_username,
                "avatar_url": user.avatar_url,
                "has_github_token": bool(user.encrypted_github_token),
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "updated_at": user.updated_at,
            }
            if user.encrypted_github_token:
                update_data["encrypted_github_token"] = user.encrypted_github_token
            if user.password_hash:
                update_data["password_hash"] = user.password_hash

            # 1. First check if a user document exists by email in Atlas
            existing_by_email = db.users.find_one({"email": user.email.lower().strip()})
            if existing_by_email:
                # Update existing user using its immutable _id to prevent duplicate key error
                update_data["id"] = str(existing_by_email.get("_id", user.id))
                db.users.update_one({"_id": existing_by_email["_id"]}, {"$set": update_data})
                return

            # 2. Check if a user document exists by _id
            existing_by_id = db.users.find_one({"_id": str(user.id)})
            if existing_by_id:
                update_data["id"] = str(user.id)
                db.users.update_one({"_id": str(user.id)}, {"$set": update_data})
                return

            # 3. New user insertion
            doc = {
                "_id": str(user.id),
                "id": str(user.id),
                **update_data,
                "created_at": user.created_at,
            }
            try:
                db.users.insert_one(doc)
            except Exception as insert_err:
                # If concurrent insert triggered duplicate email, fall back to update by email
                db.users.update_one({"email": user.email.lower().strip()}, {"$set": update_data})
        except Exception as e:
            logger.warning(f"Error syncing user {user.id} to MongoDB Atlas: {e}")

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Look up user document in MongoDB Atlas by email."""
        if not is_mongodb_configured():
            return None
        db = get_mongodb_database()
        if db is None:
            return None
        try:
            return db.users.find_one({"email": email.lower().strip()})
        except Exception as e:
            logger.warning(f"Error finding user by email in MongoDB Atlas: {e}")
            return None

    @staticmethod
    def get_user_by_id(user_id: Any) -> Optional[Dict[str, Any]]:
        """Look up user document in MongoDB Atlas by string ID or ObjectId."""
        if not is_mongodb_configured():
            return None
        db = get_mongodb_database()
        if db is None:
            return None
        try:
            return db.users.find_one({"_id": str(user_id)}) or db.users.find_one({"id": str(user_id)})
        except Exception as e:
            logger.warning(f"Error finding user by id in MongoDB Atlas: {e}")
            return None

    @staticmethod
    def restore_user_data_if_empty(user_id: Any, session: Any):
        """
        If the local SQL database is empty for user_id (e.g. after container redeploy),
        pull projects, features, and incubator ideas from persistent MongoDB Atlas.
        """
        if not is_mongodb_configured():
            return
        db = get_mongodb_database()
        if db is None:
            return

        try:
            import uuid
            from sqlmodel import select, func
            from app.models.project import Project
            from app.models.feature import Feature
            from app.models.future_project import FutureProject

            user_uuid = uuid.UUID(str(user_id)) if not isinstance(user_id, uuid.UUID) else user_id
            uid_str = str(user_uuid)

            # Check if projects exist in SQL
            existing_count = session.exec(
                select(func.count(Project.id)).where(Project.user_id == user_uuid)
            ).one()

            if existing_count == 0:
                mongo_projects = list(db.projects.find({"user_id": uid_str}))
                for mp in mongo_projects:
                    try:
                        p_uuid = uuid.UUID(str(mp.get("id") or mp.get("_id")))
                        p_type = mp.get("project_type", "RESUME")
                        p_status = mp.get("status", "IN_PROGRESS")

                        project = Project(
                            id=p_uuid,
                            user_id=user_uuid,
                            github_repo_id=mp.get("github_repo_id"),
                            name=mp.get("name", "Project"),
                            description=mp.get("description"),
                            html_url=mp.get("html_url"),
                            primary_language=mp.get("primary_language"),
                            stars_count=mp.get("stars_count", 0),
                            forks_count=mp.get("forks_count", 0),
                            default_branch=mp.get("default_branch", "main"),
                            project_type=p_type,
                            status=p_status,
                            goal=mp.get("goal"),
                            needs_review=mp.get("needs_review", False),
                            is_starred=mp.get("is_starred", False),
                            is_hidden=mp.get("is_hidden", False),
                            live_url=mp.get("live_url"),
                            order_index=mp.get("order_index", 0),
                            manual_progress_override=mp.get("manual_progress_override"),
                            use_manual_progress=mp.get("use_manual_progress", False),
                        )
                        session.add(project)

                        # Restore features for this project
                        mongo_features = list(db.features.find({"project_id": str(p_uuid)}))
                        for mf in mongo_features:
                            f_uuid = uuid.UUID(str(mf.get("id") or mf.get("_id")))
                            feat = Feature(
                                id=f_uuid,
                                project_id=p_uuid,
                                title=mf.get("title", "Feature"),
                                description=mf.get("description"),
                                priority=mf.get("priority", "P1"),
                                status=mf.get("status", "BACKLOG"),
                                order_index=mf.get("order_index", 0),
                            )
                            session.add(feat)
                    except Exception as pe:
                        logger.warning(f"Error restoring project {mp.get('name')}: {pe}")

                # Also restore future projects / ideas
                mongo_ideas = list(db.future_projects.find({"user_id": uid_str}))
                for mi in mongo_ideas:
                    try:
                        i_uuid = uuid.UUID(str(mi.get("id") or mi.get("_id")))
                        idea = FutureProject(
                            id=i_uuid,
                            user_id=user_uuid,
                            title=mi.get("title", "Idea"),
                            elevator_pitch=mi.get("elevator_pitch"),
                            target_tech_stack=mi.get("target_tech_stack"),
                            project_type=mi.get("project_type", "RESUME"),
                            priority=mi.get("priority", "P1"),
                            status=mi.get("status", "IDEA"),
                            notes=mi.get("notes"),
                            raw_message=mi.get("raw_message"),
                        )
                        session.add(idea)
                    except Exception as ie:
                        logger.warning(f"Error restoring future project {mi.get('title')}: {ie}")

                session.commit()
                logger.info(f"Successfully restored data from MongoDB Atlas for user {user_uuid}")
        except Exception as e:
            logger.warning(f"Error restoring user data from MongoDB Atlas: {e}")

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
                "live_url": project.live_url,
                "primary_language": project.primary_language,
                "stars_count": project.stars_count,
                "forks_count": project.forks_count,
                "default_branch": project.default_branch,
                "project_type": project.project_type.value if hasattr(project.project_type, "value") else str(project.project_type),
                "status": project.status.value if hasattr(project.status, "value") else str(project.status),
                "goal": project.goal,
                "needs_review": project.needs_review,
                "is_starred": project.is_starred,
                "is_hidden": project.is_hidden,
                "order_index": project.order_index,
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
                "raw_message": idea.raw_message,
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

    @staticmethod
    def save_chat_message(
        user_id: Any,
        role: str,
        content: str,
        project_id: Optional[Any] = None,
        is_feature_pitch: bool = False,
        subagent_data: Optional[Dict[str, Any]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        tier_used: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Save a chat message with sub-agent outputs to MongoDB Atlas."""
        import uuid
        from datetime import datetime, timezone
        
        msg_id = str(uuid.uuid4())
        doc = {
            "_id": msg_id,
            "id": msg_id,
            "user_id": str(user_id),
            "project_id": str(project_id) if project_id else None,
            "role": role,
            "content": content,
            "is_feature_pitch": is_feature_pitch,
            "subagent_data": subagent_data or {},
            "citations": citations or [],
            "tier_used": tier_used or "Local Intelligent Heuristic",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if is_mongodb_configured():
            db = get_mongodb_database()
            if db is not None:
                try:
                    db.chat_messages.insert_one(doc)
                except Exception as e:
                    logger.warning(f"Error saving chat message to MongoDB: {e}")

        return doc

    @staticmethod
    def get_chat_history(user_id: Any, project_id: Optional[Any] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve user's chat history from MongoDB Atlas."""
        if not is_mongodb_configured():
            return []
        db = get_mongodb_database()
        if db is None:
            return []
        try:
            query: Dict[str, Any] = {"user_id": str(user_id)}
            if project_id:
                query["project_id"] = str(project_id)
            cursor = db.chat_messages.find(query).sort("created_at", 1).limit(limit)
            results = []
            for doc in cursor:
                doc["id"] = str(doc.get("_id", doc.get("id")))
                doc.pop("_id", None)
                results.append(doc)
            return results
        except Exception as e:
            logger.warning(f"Error loading chat history from MongoDB: {e}")
            return []

    @staticmethod
    def clear_chat_history(user_id: Any, project_id: Optional[Any] = None) -> bool:
        """Clear user's chat history in MongoDB Atlas."""
        if not is_mongodb_configured():
            return False
        db = get_mongodb_database()
        if db is None:
            return False
        try:
            query: Dict[str, Any] = {"user_id": str(user_id)}
            if project_id:
                query["project_id"] = str(project_id)
            db.chat_messages.delete_many(query)
            return True
        except Exception as e:
            logger.warning(f"Error clearing chat history from MongoDB: {e}")
            return False
