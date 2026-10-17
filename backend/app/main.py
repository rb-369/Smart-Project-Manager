from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite / PostgreSQL tables on startup
    init_db()
    # Initialize MongoDB Atlas indexes if configured
    try:
        from app.core.mongodb import init_mongodb_indexes
        init_mongodb_indexes()
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.api.v1.auth import router as auth_router
from app.api.v1.github import router as github_router
from app.api.v1.ai import router as ai_router
from app.api.v1.projects import router as projects_router
from app.api.v1.features import router as features_router
from app.api.v1.future_projects import router as future_projects_router
from app.api.v1.mongodb_status import router as mongodb_router


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    """Verify backend service and database operational status."""
    from app.core.mongodb import check_mongodb_connection
    mongo_status = check_mongodb_connection()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mongodb": mongo_status
    }


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(github_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(features_router, prefix=settings.API_V1_STR)
app.include_router(future_projects_router, prefix=settings.API_V1_STR)
app.include_router(mongodb_router, prefix=settings.API_V1_STR)

