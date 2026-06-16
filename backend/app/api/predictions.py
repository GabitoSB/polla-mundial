from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionAdminResponse, PredictionCreate, PredictionResponse
from app.services.knockout import is_knockout_round, normalize_knockout_prediction
from app.services.match_predictions import assert_match_predictions_visible, list_match_predictions as fetch_match_predictions

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _apply_prediction_fields(match: Match, payload: PredictionCreate) -> dict:
    home, away = payload.predicted_home, payload.predicted_away
    penalty = payload.predicted_penalty_winner
    extra = payload.predicted_extra_time

    if is_knockout_round(match.round_name):
        home, away, penalty, extra = normalize_knockout_prediction(
            match, home, away, penalty, extra,
        )
    else:
        penalty, extra = None, None

    return {
        "predicted_home": home,
        "predicted_away": away,
        "predicted_penalty_winner": penalty,
        "predicted_extra_time": extra,
    }


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

    fields = _apply_prediction_fields(match, payload)
    prediction = Prediction(
        user_id=current_user.id,
        match_id=payload.match_id,
        **fields,
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

    fields = _apply_prediction_fields(match, payload)
    prediction.predicted_home = fields["predicted_home"]
    prediction.predicted_away = fields["predicted_away"]
    prediction.predicted_penalty_winner = fields["predicted_penalty_winner"]
    prediction.predicted_extra_time = fields["predicted_extra_time"]
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


@router.get("/match/{match_id}", response_model=list[PredictionAdminResponse])
def list_predictions_for_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todas las predicciones de un partido (solo lectura)."""
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    assert_match_predictions_visible(match, is_admin=current_user.is_admin)
    return fetch_match_predictions(db, match_id)
