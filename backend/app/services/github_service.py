import base64
from typing import List, Optional, Tuple
import httpx
from sqlmodel import Session, select

from app.core.security import decrypt_token
from app.models.user import User
from app.models.project import Project
from app.models.enums import ProjectType, ProjectStatus


class GitHubService:
    BASE_URL = "https://api.github.com"
    HEADERS = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "DevCommand-App",
    }

    @classmethod
    async def fetch_user_repositories(cls, token: str) -> List[dict]:
        """Fetch all repositories belonging to the authenticated user."""
        headers = {**cls.HEADERS, "Authorization": f"Bearer {token}"}
        url = f"{cls.BASE_URL}/user/repos?sort=created&direction=desc&per_page=100&affiliation=owner"
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 401:
                raise ValueError("Invalid or expired GitHub Personal Access Token")
            if resp.status_code != 200:
                raise RuntimeError(f"GitHub API returned error: {resp.status_code} - {resp.text}")
            return resp.json()

    @classmethod
    async def fetch_repo_readme(cls, token: str, full_name: str) -> Optional[str]:
        """Fetch raw README content for a repository to supply AI triage context."""
        headers = {**cls.HEADERS, "Authorization": f"Bearer {token}"}
        url = f"{cls.BASE_URL}/repos/{full_name}/readme"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("content", "")
                    encoding = data.get("encoding", "")
                    if encoding == "base64" and content:
                        decoded = base64.b64decode(content).decode("utf-8", errors="ignore")
                        # Truncate large READMEs to 4,000 chars to fit easily into AI context
                        return decoded[:4000]
        except Exception:
            pass
        return None

    @classmethod
    async def sync_repositories(cls, user: User, session: Session) -> Tuple[int, int, List[str]]:
        """Sync user repositories from GitHub into Projects table.
        
        Returns: (new_repos_count, updated_repos_count, imported_repo_names)
        """
        if not user.encrypted_github_token:
            raise ValueError("No GitHub token connected. Please set your GitHub PAT in settings.")

        token = decrypt_token(user.encrypted_github_token)
        if not token:
            raise ValueError("Failed to decrypt GitHub token.")

        repos = await cls.fetch_user_repositories(token)

        # Query existing project repo IDs for this user
        existing_stmt = select(Project).where(
            Project.user_id == user.id,
            Project.github_repo_id.is_not(None)
        )
        existing_projects = session.exec(existing_stmt).all()
        existing_by_repo_id = {p.github_repo_id: p for p in existing_projects}

        new_count = 0
        updated_count = 0
        newly_imported_names: List[str] = []

        for r in repos:
            repo_id = r.get("id")
            if not repo_id:
                continue

            repo_name = r.get("name", "Untitled")
            full_name = r.get("full_name", repo_name)
            desc = r.get("description")
            html_url = r.get("html_url")
            lang = r.get("language")
            stars = r.get("stargazers_count", 0)
            forks = r.get("forks_count", 0)
            default_branch = r.get("default_branch", "main")

            if repo_id in existing_by_repo_id:
                # Update existing repo stats
                existing_p = existing_by_repo_id[repo_id]
                existing_p.stars_count = stars
                existing_p.forks_count = forks
                if desc and not existing_p.description:
                    existing_p.description = desc
                if html_url:
                    existing_p.html_url = html_url
                if lang and not existing_p.primary_language:
                    existing_p.primary_language = lang
                session.add(existing_p)
                updated_count += 1
            else:
                # Ingest new repository as a Project in "Needs Review" queue
                readme = await cls.fetch_repo_readme(token, full_name)

                new_project = Project(
                    user_id=user.id,
                    github_repo_id=repo_id,
                    name=repo_name,
                    description=desc,
                    html_url=html_url,
                    primary_language=lang,
                    stars_count=stars,
                    forks_count=forks,
                    default_branch=default_branch,
                    readme_content=readme,
                    project_type=ProjectType.RESUME,  # Default, to be reviewed
                    status=ProjectStatus.IN_PROGRESS,
                    needs_review=True,  # Put in Needs Review Tray
                )
                session.add(new_project)
                new_count += 1
                newly_imported_names.append(repo_name)

        session.commit()
        return new_count, updated_count, newly_imported_names
