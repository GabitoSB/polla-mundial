from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreate, PredictionResponse

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _assert_match_open(match: Match) -> None:
    """Raises 403 if predictions are locked (match already started)."""
    now = datetime.now(timezone.utc)
    # Make start_time timezone-aware if stored as naive UTC
    start = match.start_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if now >= start:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las predicciones para este partido ya están cerradas",
        )


@router.post("/", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def create_prediction(
    payload: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.get(Match, payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    _assert_match_open(match)

    existing = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id, Prediction.match_id == payload.match_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Ya tienes una predicción para este partido. Usa PUT para modificarla.",
        )

    prediction = Prediction(
        user_id=current_user.id,
        match_id=payload.match_id,
        predicted_home=payload.predicted_home,
        predicted_away=payload.predicted_away,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


@router.put("/{prediction_id}", response_model=PredictionResponse)
def update_prediction(
    prediction_id: int,
    payload: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = db.get(Prediction, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Predicción no encontrada")
    if prediction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes modificar la predicción de otro usuario")

    match = db.get(Match, prediction.match_id)
    _assert_match_open(match)

    prediction.predicted_home = payload.predicted_home
    prediction.predicted_away = payload.predicted_away
    db.commit()
    db.refresh(prediction)
    return prediction


@router.get("/my", response_model=list[PredictionResponse])
def my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.match_id)
        .all()
    )
