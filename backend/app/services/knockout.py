"""Helpers for knockout-round predictions."""
from __future__ import annotations

from fastapi import HTTPException, status

from app.models.match import Match

KNOCKOUT_ROUNDS = frozenset({
    "Dieciseisavos",
    "Octavos de Final",
    "Cuartos de Final",
    "Semifinal",
    "Tercer Puesto",
    "Final",
})


def is_knockout_round(round_name: str | None) -> bool:
    return round_name in KNOCKOUT_ROUNDS


def normalize_knockout_prediction(
    match: Match,
    predicted_home: int,
    predicted_away: int,
    predicted_penalty_winner: str | None,
    predicted_extra_time: bool | None,
) -> tuple[int, int, str | None, bool | None]:
    """
    Validates and normalizes knockout prediction fields.

    - Non-draw: extra time (Sí/No) required.
    - Draw: penalty winner required; extra time implicit (always True before penales).
    """
    is_draw = predicted_home == predicted_away

    if is_draw:
        if not predicted_penalty_winner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="En empate debes indicar quién pasa por penales",
            )
        if predicted_penalty_winner not in (match.home_team, match.away_team):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ganador por penales debe ser uno de los equipos del partido",
            )
        return predicted_home, predicted_away, predicted_penalty_winner, True

    if predicted_extra_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Indica si habrá alargue (Sí o No)",
        )

    if predicted_penalty_winner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ganador por penales solo aplica si pronosticas empate",
        )
    return predicted_home, predicted_away, None, predicted_extra_time


def normalize_knockout_result(
    match: Match,
    home_score: int,
    away_score: int,
    penalty_winner: str | None,
    has_extra_time: bool | None,
) -> tuple[int, int, str | None, bool | None]:
    """
    Validates and normalizes knockout match results set by admin.

    - Non-draw: has_extra_time (Sí/No) required.
    - Draw: penalty_winner required; extra time implicit (always True before penales).
    """
    is_draw = home_score == away_score

    if is_draw:
        if not penalty_winner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="En empate debes indicar quién ganó por penales",
            )
        if penalty_winner not in (match.home_team, match.away_team):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ganador por penales debe ser uno de los equipos del partido",
            )
        return home_score, away_score, penalty_winner, True

    if has_extra_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Indica si hubo alargue (Sí o No)",
        )
    if penalty_winner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ganador por penales solo aplica si el marcador es empate",
        )
    return home_score, away_score, None, has_extra_time
