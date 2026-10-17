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

    # Safely migrate avatar_url column for SQLite if not present
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR;"))
    except Exception:
        pass

    # Safely migrate projects columns for SQLite if not present
    for col, col_type in [
        ("is_starred", "BOOLEAN DEFAULT 0"),
        ("is_hidden", "BOOLEAN DEFAULT 0"),
        ("live_url", "VARCHAR"),
        ("order_index", "INTEGER DEFAULT 0"),
    ]:
        try:
            from sqlalchemy import text
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col} {col_type};"))
        except Exception:
            pass

    # Safely migrate future_projects columns for SQLite if not present
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE future_projects ADD COLUMN raw_message TEXT;"))
    except Exception:
        pass



def get_session() -> Generator[Session, None, None]:
    """Dependency for providing a database session per request."""
    with Session(engine) as session:
        yield session


# Alias for backward-compatibility
get_db = get_session
