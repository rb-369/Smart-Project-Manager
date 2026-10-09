from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Configure SQLite connect_args if using SQLite
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)


def init_db() -> None:
    """Initialize database tables from SQLModel metadata."""
    # Ensure all models are imported before creating tables
    import app.models.user  # noqa: F401
    import app.models.project  # noqa: F401
    import app.models.feature  # noqa: F401
    import app.models.future_project  # noqa: F401
    import app.models.ai_log  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency for providing a database session per request."""
    with Session(engine) as session:
        yield session
