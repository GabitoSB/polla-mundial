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


# ── Bracket propagation maps ──────────────────────────────────────────────────
# Maps source match_number → (target match_number, slot) for the winner.
_WINNER_SLOT: dict[int, tuple[int, str]] = {
    # Dieciseisavos → Octavos
    73: (90, "home"), 74: (89, "home"), 75: (90, "away"), 76: (91, "home"),
    77: (89, "away"), 78: (91, "away"), 79: (92, "home"), 80: (92, "away"),
    81: (94, "home"), 82: (94, "away"), 83: (93, "home"), 84: (93, "away"),
    85: (96, "home"), 86: (95, "home"), 87: (96, "away"), 88: (95, "away"),
    # Octavos → Cuartos
    89: (97, "home"), 90: (97, "away"), 91: (99, "home"), 92: (99, "away"),
    93: (98, "home"), 94: (98, "away"), 95: (100, "home"), 96: (100, "away"),
    # Cuartos → Semifinales
    97: (101, "home"), 98: (101, "away"), 99: (102, "home"), 100: (102, "away"),
    # Semifinales → Final
    101: (104, "home"), 102: (104, "away"),
}

# Loser of each semi goes to the 3rd-place match (P103).
_LOSER_SLOT: dict[int, tuple[int, str]] = {
    101: (103, "home"),
    102: (103, "away"),
}


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
    3. Auto-propagate bracket: update the next round's match with the winner's
       team name (and loser for semi-finals → 3rd place match).
    4. For group stage matches, if the entire group is now finished, auto-fill
       the Dieciseisavos teams based on computed standings.
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

    # Bracket propagation for knockout matches
    _propagate_bracket(db, match)

    # Group standings propagation for group-stage matches
    if match.round_name and match.round_name.startswith("Grupo "):
        _propagate_group_results(db, match.round_name)

    db.commit()


# ── Bracket helpers ───────────────────────────────────────────────────────────

def _propagate_bracket(db: Session, match: Match) -> None:
    """
    After a knockout match result is saved, write the winner (and loser for
    semis) into the corresponding slot of the next round's match.
    Draws are skipped — they can't happen in knockout (extra time/penalties
    produce a winner before this point in the real tournament, and the admin
    enters the final score including ET/PKs).
    """
    mn = match.match_number
    if mn is None or match.home_score is None or match.away_score is None:
        return

    if match.home_score > match.away_score:
        winner, loser = match.home_team, match.away_team
    elif match.away_score > match.home_score:
        winner, loser = match.away_team, match.home_team
    else:
        return  # draw — no propagation for group stage via this path

    if mn in _WINNER_SLOT:
        target_num, slot = _WINNER_SLOT[mn]
        target = db.query(Match).filter(Match.match_number == target_num).first()
        if target:
            if slot == "home":
                target.home_team = winner
            else:
                target.away_team = winner
            db.flush()

    if mn in _LOSER_SLOT:
        target_num, slot = _LOSER_SLOT[mn]
        target = db.query(Match).filter(Match.match_number == target_num).first()
        if target:
            if slot == "home":
                target.home_team = loser
            else:
                target.away_team = loser
            db.flush()


def _propagate_group_results(db: Session, group_name: str) -> None:
    """
    Once every match in a group has a result, compute the standings and update
    any Dieciseisavos match whose home_team / away_team contains a placeholder
    like '1° Grupo A' or '2º Grupo A' with the real team names.
    """
    group_matches = db.query(Match).filter(Match.round_name == group_name).all()
    if not group_matches:
        return

    if not all(m.home_score is not None and m.away_score is not None for m in group_matches):
        return  # group not fully played yet

    # Accumulate stats per team
    teams: dict[str, dict] = {}
    for m in group_matches:
        for team, gf, ga in [
            (m.home_team, m.home_score, m.away_score),
            (m.away_team, m.away_score, m.home_score),
        ]:
            if team not in teams:
                teams[team] = {"pts": 0, "gf": 0, "ga": 0}
            teams[team]["pts"] += 3 if gf > ga else (1 if gf == ga else 0)
            teams[team]["gf"] += gf
            teams[team]["ga"] += ga

    sorted_teams = sorted(
        teams.items(),
        key=lambda x: (-x[1]["pts"], -(x[1]["gf"] - x[1]["ga"]), -x[1]["gf"], x[0]),
    )

    gl = group_name.split()[-1]  # "Grupo A" → "A"
    # Accept both '°' and 'º' variants that may have been seeded
    replacements: dict[str, str] = {}
    if len(sorted_teams) > 0:
        replacements[f"1° Grupo {gl}"] = sorted_teams[0][0]
        replacements[f"1º Grupo {gl}"] = sorted_teams[0][0]
    if len(sorted_teams) > 1:
        replacements[f"2° Grupo {gl}"] = sorted_teams[1][0]
        replacements[f"2º Grupo {gl}"] = sorted_teams[1][0]
    if len(sorted_teams) > 2:
        replacements[f"3° Grupo {gl}"] = sorted_teams[2][0]
        replacements[f"3º Grupo {gl}"] = sorted_teams[2][0]

    knockout_matches = db.query(Match).filter(Match.match_number >= 73).all()
    for m in knockout_matches:
        changed = False
        if m.home_team in replacements:
            m.home_team = replacements[m.home_team]
            changed = True
        if m.away_team in replacements:
            m.away_team = replacements[m.away_team]
            changed = True
        if changed:
            db.flush()


# ── User stats recomputation ──────────────────────────────────────────────────

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
