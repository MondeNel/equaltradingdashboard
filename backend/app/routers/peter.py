from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.peter import PeterAnalysisRequest, PeterAnalysisResponse
from app.services.peter_service import analyse

router = APIRouter(prefix="/api/peter", tags=["peter"])


@router.post("/analyse", response_model=PeterAnalysisResponse)
async def peter_analyse(
    req: PeterAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analyse(current_user.id, req, db)