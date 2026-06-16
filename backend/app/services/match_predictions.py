"""Read-only listing of all users' predictions for a match."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionAdminResponse


def assert_match_predictions_visible(match: Match, *, is_admin: bool = False) -> None:
    """Admins can always view; other users only after kickoff."""
    if is_admin:
        return

    now = datetime.now(timezone.utc)
    start = match.start_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if now < start:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las predicciones de otros jugadores se revelan al iniciar el partido",
        )


def list_match_predictions(db: Session, match_id: int) -> list[PredictionAdminResponse]:
    rows = (
        db.query(Prediction, User.username)
        .join(User, Prediction.user_id == User.id)
        .filter(Prediction.match_id == match_id)
        .order_by(User.username)
        .all()
    )

    return [
        PredictionAdminResponse(
            id=pred.id,
            user_id=pred.user_id,
            username=username,
            match_id=pred.match_id,
            predicted_home=pred.predicted_home,
            predicted_away=pred.predicted_away,
            predicted_penalty_winner=pred.predicted_penalty_winner,
            predicted_extra_time=pred.predicted_extra_time,
            points=pred.points,
            created_at=pred.created_at,
            updated_at=pred.updated_at,
        )
        for pred, username in rows
    ]
