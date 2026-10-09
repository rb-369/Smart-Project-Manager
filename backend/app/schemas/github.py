from typing import Optional, List
from pydantic import BaseModel, Field


class UpdateGitHubTokenRequest(BaseModel):
    token: str = Field(min_length=10, description="GitHub Personal Access Token (classic or fine-grained)")


class GitHubSyncResponse(BaseModel):
    status: str
    total_fetched: int
    new_repos_imported: int
    existing_repos_updated: int
    imported_repo_names: List[str]


class GitHubStatusResponse(BaseModel):
    is_connected: bool
    github_username: Optional[str] = None
    total_projects_synced: int
    needs_review_count: int
