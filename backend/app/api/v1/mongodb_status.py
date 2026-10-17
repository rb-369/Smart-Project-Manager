from fastapi import APIRouter
from app.core.mongodb import check_mongodb_connection

router = APIRouter(prefix="/mongodb", tags=["MongoDB Atlas Integration"])


@router.get("/status")
def get_mongodb_status():
    """Check MongoDB Atlas cluster connection status and database details."""
    return check_mongodb_connection()
