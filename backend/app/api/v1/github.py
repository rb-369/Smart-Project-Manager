from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.security import encrypt_token
from app.models.user import User
from app.models.project import Project
from app.schemas.github import (
    UpdateGitHubTokenRequest,
    GitHubSyncResponse,
    GitHubStatusResponse,
)
from app.services.github_service import GitHubService
from app.api.deps import get_current_user

router = APIRouter(prefix="/github", tags=["GitHub Integration"])


@router.post("/token", response_model=dict)
def update_github_token(
    request: UpdateGitHubTokenRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Save or update user's GitHub Personal Access Token (stored AES-256 encrypted)."""
    current_user.encrypted_github_token = encrypt_token(request.token.strip())
    session.add(current_user)
    session.commit()
    return {"message": "GitHub token successfully updated and encrypted."}


@router.post("/sync", response_model=GitHubSyncResponse)
async def sync_github_repositories(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Trigger on-demand synchronization of GitHub repositories."""
    if not current_user.encrypted_github_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub token found. Please set your GitHub Personal Access Token in settings."
        )

    try:
        new_count, updated_count, names = await GitHubService.sync_repositories(
            current_user, session
        )
        return GitHubSyncResponse(
            status="success",
            total_fetched=new_count + updated_count,
            new_repos_imported=new_count,
            existing_repos_updated=updated_count,
            imported_repo_names=names
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub sync error: {str(e)}"
        )


@router.get("/status", response_model=GitHubStatusResponse)
def get_github_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get GitHub connection status and synced projects count."""
    is_connected = bool(current_user.encrypted_github_token)

    total_stmt = select(func.count(Project.id)).where(
        Project.user_id == current_user.id,
        Project.github_repo_id.is_not(None)
    )
    total_synced = session.exec(total_stmt).one() or 0

    review_stmt = select(func.count(Project.id)).where(
        Project.user_id == current_user.id,
        Project.needs_review == True  # noqa: E712
    )
    needs_review = session.exec(review_stmt).one() or 0

    return GitHubStatusResponse(
        is_connected=is_connected,
        github_username=current_user.github_username,
        total_projects_synced=total_synced,
        needs_review_count=needs_review
    )
