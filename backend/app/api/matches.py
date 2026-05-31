from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.user import User
from app.schemas.match import MatchCreate, MatchResponse, MatchResultUpdate, MatchTeamsUpdate

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/", response_model=list[MatchResponse])
def list_matches(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Match).order_by(Match.start_time).all()


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


@router.put("/{match_id}/teams", response_model=MatchResponse)
def update_teams(
    match_id: int,
    payload: MatchTeamsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Manually update the home/away team names (useful for setting knockout-stage TBD teams)."""
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    match.home_team = payload.home_team
    match.away_team = payload.away_team
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

    match.home_score = payload.home_score
    match.away_score = payload.away_score
    db.commit()

    # Trigger point calculation (imported here to avoid circular imports)
    from app.services.scoring import calculate_match_points
    calculate_match_points(db, match)

    db.refresh(match)
    return match
