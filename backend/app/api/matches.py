from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.match import MatchCreate, MatchResponse, MatchResultUpdate, MatchScheduleUpdate
from app.schemas.prediction import PredictionAdminResponse
from app.services.knockout import is_knockout_round, normalize_knockout_result

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/", response_model=list[MatchResponse])
def list_matches(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Match).order_by(Match.start_time, Match.match_number).all()


@router.get("/{match_id}/predictions", response_model=list[PredictionAdminResponse])
def list_match_predictions(
    match_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Predicciones de todos los usuarios para un partido (solo lectura, admin)."""
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

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


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(payload: MatchCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    match = Match(**payload.model_dump())
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    if match.home_score is not None:
        raise HTTPException(status_code=400, detail="No se puede eliminar un partido con resultado cargado")
    db.delete(match)
    db.commit()


@router.put("/{match_id}/schedule", response_model=MatchResponse)
def update_schedule(
    match_id: int,
    payload: MatchScheduleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    match.start_time = payload.start_time
    db.commit()
    db.refresh(match)
    return match


@router.put("/{match_id}/result", response_model=MatchResponse)
def update_result(
    match_id: int,
    payload: MatchResultUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    home_score = payload.home_score
    away_score = payload.away_score
    penalty_winner = payload.penalty_winner
    has_extra_time = payload.has_extra_time

    if is_knockout_round(match.round_name):
        home_score, away_score, penalty_winner, has_extra_time = normalize_knockout_result(
            match,
            home_score,
            away_score,
            penalty_winner,
            has_extra_time,
        )
    else:
        penalty_winner = None
        has_extra_time = None

    match.home_score = home_score
    match.away_score = away_score
    match.penalty_winner = penalty_winner
    match.has_extra_time = has_extra_time
    db.commit()

    # Trigger point calculation (imported here to avoid circular imports)
    from app.services.scoring import calculate_match_points
    calculate_match_points(db, match)

    db.refresh(match)
    return match


@router.delete("/{match_id}/result", response_model=MatchResponse)
def clear_result(
    match_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    if match.home_score is None and match.away_score is None:
        raise HTTPException(status_code=400, detail="Este partido no tiene resultado cargado")

    from app.services.scoring import clear_match_result

    clear_match_result(db, match)
    db.refresh(match)
    return match
