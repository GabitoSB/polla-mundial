from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.leaderboard_history import build_leaderboard_history

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    total_points: int
    exact_results: int
    partial_score_hits: int
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class HistoryPlayer(BaseModel):
    user_id: int
    username: str
    avatar_url: str | None = None


class HistorySnapshot(BaseModel):
    key: str
    match_id: int | None = None
    match_number: int | None = None
    label: str
    date: str | None = None


class LeaderboardHistoryResponse(BaseModel):
    snapshots: list[HistorySnapshot]
    players: list[HistoryPlayer]
    rows: list[dict]


@router.get("/history", response_model=LeaderboardHistoryResponse)
def get_leaderboard_history(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return build_leaderboard_history(db)


@router.get("/", response_model=list[LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.is_active == True, User.is_admin == False)  # noqa: E712
        .order_by(
            User.total_points.desc(),
            User.exact_results.desc(),
            User.partial_score_hits.desc(),
            User.username.asc(),  # alphabetical as final stable sort
        )
        .all()
    )

    return [
        LeaderboardEntry(
            rank=idx + 1,
            user_id=u.id,
            username=u.username,
            total_points=u.total_points,
            exact_results=u.exact_results,
            partial_score_hits=u.partial_score_hits,
            avatar_url=u.avatar_url,
        )
        for idx, u in enumerate(users)
    ]
