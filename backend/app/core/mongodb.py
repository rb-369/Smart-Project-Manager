import logging
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError
import motor.motor_asyncio

from app.core.config import settings

logger = logging.getLogger("devcommand.mongodb")

_async_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
_sync_client: Optional[MongoClient] = None


def get_mongodb_url() -> str:
    """Return sanitized MongoDB Atlas URL if configured."""
    return settings.MONGODB_URL.strip() if settings.MONGODB_URL else ""


def is_mongodb_configured() -> bool:
    """Check if MongoDB URL is set."""
    return bool(get_mongodb_url())


def get_sync_mongodb_client() -> Optional[MongoClient]:
    """Get or initialize synchronous MongoClient for Atlas."""
    global _sync_client
    url = get_mongodb_url()
    if not url:
        return None
    if _sync_client is None:
        try:
            _sync_client = MongoClient(
                url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                appName="DevCommand"
            )
        except (ConfigurationError, Exception) as e:
            logger.warning(f"Failed to create MongoDB client: {e}")
            return None
    return _sync_client


def get_async_mongodb_client() -> Optional[motor.motor_asyncio.AsyncIOMotorClient]:
    """Get or initialize asynchronous Motor client for Atlas."""
    global _async_client
    url = get_mongodb_url()
    if not url:
        return None
    if _async_client is None:
        try:
            _async_client = motor.motor_asyncio.AsyncIOMotorClient(
                url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                appName="DevCommand"
            )
        except (ConfigurationError, Exception) as e:
            logger.warning(f"Failed to create Async MongoDB client: {e}")
            return None
    return _async_client


def get_mongodb_database(db_name: Optional[str] = None):
    """Retrieve the active MongoDB database."""
    client = get_sync_mongodb_client()
    if client is None:
        return None
    target_name = db_name or settings.MONGODB_DB_NAME or "devcommand"
    return client[target_name]


def get_async_mongodb_database(db_name: Optional[str] = None):
    """Retrieve the async MongoDB database."""
    client = get_async_mongodb_client()
    if client is None:
        return None
    target_name = db_name or settings.MONGODB_DB_NAME or "devcommand"
    return client[target_name]


def check_mongodb_connection() -> Dict[str, Any]:
    """Ping MongoDB Atlas and check connectivity status."""
    url = get_mongodb_url()
    if not url:
        return {
            "configured": False,
            "connected": False,
            "message": "MongoDB Atlas connection URL is not set in .env (MONGODB_URL).",
            "database": settings.MONGODB_DB_NAME,
        }

    try:
        client = get_sync_mongodb_client()
        if client is None:
            return {
                "configured": True,
                "connected": False,
                "message": "Invalid MongoDB connection string.",
                "database": settings.MONGODB_DB_NAME,
            }

        # Issue ping command
        client.admin.command("ping")
        # Extract cluster hostname safely
        server_info = client.address
        host_info = f"{server_info[0]}:{server_info[1]}" if server_info else "Atlas Cluster"

        return {
            "configured": True,
            "connected": True,
            "message": f"Successfully connected to MongoDB Atlas ({host_info}).",
            "database": settings.MONGODB_DB_NAME,
            "host": host_info,
        }
    except ConnectionFailure as e:
        return {
            "configured": True,
            "connected": False,
            "message": f"Cannot connect to MongoDB Atlas: {str(e)}",
            "database": settings.MONGODB_DB_NAME,
        }
    except Exception as e:
        return {
            "configured": True,
            "connected": False,
            "message": f"MongoDB Atlas error: {str(e)}",
            "database": settings.MONGODB_DB_NAME,
        }


def init_mongodb_indexes():
    """Ensure recommended indexes exist on MongoDB Atlas collections."""
    db = get_mongodb_database()
    if db is None:
        return

    try:
        # Users indexes
        db.users.create_index("email", unique=True, sparse=True)
        db.users.create_index("github_username", sparse=True)

        # Projects indexes
        db.projects.create_index([("user_id", 1), ("name", 1)])
        db.projects.create_index([("user_id", 1), ("github_repo_id", 1)])

        # Features indexes
        db.features.create_index("project_id")

        # Future Projects indexes
        db.future_projects.create_index("user_id")

        # AI Logs indexes
        db.ai_logs.create_index([("user_id", 1), ("created_at", -1)])

        logger.info("MongoDB Atlas indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Failed to create MongoDB Atlas indexes: {e}")
