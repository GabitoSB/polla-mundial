"""
Scoring logic for the Mundial Polla.

Points per match:
  5 pts  — exact result   (predicted_home == real_home AND predicted_away == real_away)
  3 pts  — correct winner / draw  (sign of goal difference matches)
  0 pts  — anything else

Tiebreaker stats stored on User (pre-computed):
  1. total_points       — sum of all points
  2. exact_results      — count of 5-pt predictions
  3. partial_score_hits — count of predictions where at least one team's
                          goals were guessed correctly (only for 3-pt results)
                          e.g. predict 2-1, real 2-0  → home goals match → hit
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User


# ── Core scoring helpers ──────────────────────────────────────────────────────

def _sign(n: int) -> int:
    if n > 0:
        return 1
    if n < 0:
        return -1
    return 0


def score_prediction(
    predicted_home: int,
    predicted_away: int,
    real_home: int,
    real_away: int,
) -> int:
    """Returns the points earned for a single prediction."""
    if predicted_home == real_home and predicted_away == real_away:
        return 5

    if _sign(predicted_home - predicted_away) == _sign(real_home - real_away):
        return 3

    return 0


# ── Main service function ─────────────────────────────────────────────────────

def calculate_match_points(db: Session, match: Match) -> None:
    """
    Called after an admin sets (or corrects) the real score of a match.

    1. Score every prediction for this match and persist `points`.
    2. Recompute each affected user's aggregate stats from scratch so that
       a result correction is handled correctly.
    """
    if match.home_score is None or match.away_score is None:
        return

    predictions: list[Prediction] = (
        db.query(Prediction).filter(Prediction.match_id == match.id).all()
    )

    affected_user_ids: set[int] = set()

    for pred in predictions:
        pred.points = score_prediction(
            pred.predicted_home,
            pred.predicted_away,
            match.home_score,
            match.away_score,
        )
        affected_user_ids.add(pred.user_id)

    # Flush prediction.points to DB so _recompute_user_stats reads updated values
    db.flush()

    for user_id in affected_user_ids:
        _recompute_user_stats(db, user_id)

    db.commit()


def _recompute_user_stats(db: Session, user_id: int) -> None:
    """
    Recalculates total_points, exact_results and partial_score_hits for a user
    by scanning ALL their scored predictions (points IS NOT NULL).
    Recalculating from scratch handles admin result corrections gracefully.
    """
    user = db.get(User, user_id)
    if user is None:
        return

    scored_predictions = (
        db.query(Prediction)
        .filter(
            Prediction.user_id == user_id,
            Prediction.points.isnot(None),
        )
        .all()
    )

    total_points = 0
    exact_results = 0
    partial_score_hits = 0

    for pred in scored_predictions:
        total_points += pred.points

        if pred.points == 5:
            exact_results += 1

        elif pred.points == 3:
            # Tiebreaker 3: at least one team's goals guessed correctly
            match = db.get(Match, pred.match_id)
            if match and match.home_score is not None and match.away_score is not None:
                home_hit = pred.predicted_home == match.home_score
                away_hit = pred.predicted_away == match.away_score
                if home_hit or away_hit:
                    partial_score_hits += 1

    user.total_points = total_points
    user.exact_results = exact_results
    user.partial_score_hits = partial_score_hits
