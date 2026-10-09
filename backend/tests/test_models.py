import uuid
from sqlmodel import Session, select
from app.models.user import User
from app.models.project import Project
from app.models.feature import Feature
from app.models.future_project import FutureProject
from app.models.ai_log import AILog
from app.models.enums import (
    ProjectType,
    ProjectStatus,
    FeaturePriority,
    FeatureStatus,
    FutureProjectPriority,
    RecommendationType,
)
from app.core.security import hash_password, verify_password, encrypt_token, decrypt_token


def test_user_and_password_security(session: Session):
    pwd = "MySecretPassword123!"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    user = User(
        email="developer@example.com",
        password_hash=hashed,
        full_name="Alex Developer",
        github_username="alexdev",
        encrypted_github_token=encrypt_token("ghp_test_token_123456789")
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    assert user.id is not None
    assert user.email == "developer@example.com"
    decrypted_token = decrypt_token(user.encrypted_github_token)
    assert decrypted_token == "ghp_test_token_123456789"


def test_project_and_feature_cascade(session: Session):
    user = User(
        email="lead@example.com",
        password_hash=hash_password("password123"),
        full_name="Lead Engineer"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Add Project
    project = Project(
        user_id=user.id,
        name="ai-agent-hub",
        description="Autonomous agent system",
        primary_language="Python",
        project_type=ProjectType.PRODUCTION,
        status=ProjectStatus.IN_PROGRESS,
        goal="Launch production agent SaaS with 99.9% uptime"
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    # Add Features with different priorities
    f1 = Feature(
        project_id=project.id,
        title="Implement OAuth Auth",
        priority=FeaturePriority.P0,
        status=FeatureStatus.DONE
    )
    f2 = Feature(
        project_id=project.id,
        title="Add Stripe Payments",
        priority=FeaturePriority.P1,
        status=FeatureStatus.BACKLOG
    )
    session.add(f1)
    session.add(f2)
    session.commit()

    # Query project and verify relationships
    stmt = select(Project).where(Project.id == project.id)
    retrieved = session.exec(stmt).first()
    assert retrieved is not None
    assert len(retrieved.features) == 2
    assert retrieved.features[0].priority in [FeaturePriority.P0, FeaturePriority.P1]


def test_future_project_and_ai_log(session: Session):
    user = User(
        email="innovator@example.com",
        password_hash=hash_password("pwd123"),
        full_name="Tech Innovator"
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    idea = FutureProject(
        user_id=user.id,
        title="Distributed SQLite Sync Engine",
        elevator_pitch="Sync local SQLite over WebRTC",
        target_tech_stack="Rust + Flutter",
        project_type=ProjectType.RESUME,
        priority=FutureProjectPriority.P0
    )
    session.add(idea)

    ai_log = AILog(
        user_id=user.id,
        recommendation_type=RecommendationType.NEXT_PROJECT,
        provider_used="openrouter",
        model_used="meta-llama/llama-3.3-70b-instruct:free",
        response_payload='{"ideas": ["Idea 1", "Idea 2"]}'
    )
    session.add(ai_log)
    session.commit()

    assert idea.id is not None
    assert ai_log.id is not None
