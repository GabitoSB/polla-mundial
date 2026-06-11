"""
Scoring logic for the Mundial Polla.

Base points per match (all phases):
  5 pts  — exact result   (predicted_home == real_home AND predicted_away == real_away)
  3 pts  — correct winner / draw  (sign of goal difference matches)
  0 pts  — anything else

Knockout bonus (awarded on top of base points when outcome direction is correct):
  Dieciseisavos  : +1 pt
  Octavos de Final: +2 pts
  Cuartos de Final: +3 pts
  Semifinal       : +4 pts
  Tercer Puesto   : +3 pts
  Final           : +5 pts

  For a drawn knockout result (decided by penalties):
    bonus is earned ONLY if the user also predicted the correct penalty_winner.
  For a non-drawn knockout result:
    bonus is earned whenever the user got the correct winner (partial or exact).

Extra time bonus (+2 pts):
  All knockout matches. Non-draw: user picks Sí/No. Draw (penales): alargue assumed Sí.
  +2 if prediction matches the real match (requires 3 or 5 pts base).
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User


# ── Knockout bonus map ────────────────────────────────────────────────────────
KNOCKOUT_BONUS: dict[str, int] = {
    "Dieciseisavos":   1,
    "Octavos de Final": 2,
    "Cuartos de Final": 3,
    "Semifinal":        4,
    "Tercer Puesto":    3,
    "Final":            5,
}

# ── Bracket propagation maps ──────────────────────────────────────────────────
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
    predicted_penalty_winner: str | None = None,
    real_penalty_winner: str | None = None,
    predicted_extra_time: bool | None = None,
    real_extra_time: bool | None = None,
    round_name: str | None = None,
) -> int:
    """Returns the total points earned for a single prediction (base + bonuses)."""
    # ── Base score ────────────────────────────────────────────────────────────
    if predicted_home == real_home and predicted_away == real_away:
        base = 5
    elif _sign(predicted_home - predicted_away) == _sign(real_home - real_away):
        base = 3
    else:
        return 0  # wrong outcome → no bonuses possible

    # ── Knockout round bonus ──────────────────────────────────────────────────
    bonus = 0
    if round_name in KNOCKOUT_BONUS:
        round_bonus = KNOCKOUT_BONUS[round_name]
        if real_home != real_away:
            bonus = round_bonus
        else:
            # Draw decided by penalties: bonus only if correct penalty winner predicted
            if real_penalty_winner and predicted_penalty_winner == real_penalty_winner:
                bonus = round_bonus

    # ── Extra time bonus (+2 pts, all knockout matches) ───────────────────────
    extra_time_bonus = 0
    if (
        round_name in KNOCKOUT_BONUS
        and real_extra_time is not None
        and predicted_extra_time is not None
    ):
        if predicted_extra_time == real_extra_time:
            extra_time_bonus = 2

    return base + bonus + extra_time_bonus


# ── Main service function ─────────────────────────────────────────────────────

def calculate_match_points(db: Session, match: Match) -> None:
    """
    Called after an admin sets (or corrects) the real score of a match.

    1. Score every prediction for this match and persist `points`.
    2. Recompute each affected user's aggregate stats from scratch.
    3. Auto-propagate bracket (winner into next round's match).
    4. For group stage matches, auto-fill Dieciseisavos teams when group is done.
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
            predicted_penalty_winner=pred.predicted_penalty_winner,
            real_penalty_winner=match.penalty_winner,
            predicted_extra_time=pred.predicted_extra_time,
            real_extra_time=match.has_extra_time,
            round_name=match.round_name,
        )
        affected_user_ids.add(pred.user_id)

    db.flush()

    for user_id in affected_user_ids:
        _recompute_user_stats(db, user_id)

    _propagate_bracket(db, match)

    if match.round_name and match.round_name.startswith("Grupo "):
        _propagate_group_results(db, match.round_name)

    db.commit()


def clear_match_result(db: Session, match: Match) -> None:
    """Clears a match result, resets prediction points and recomputes user stats."""
    if match.home_score is None and match.away_score is None:
        return

    predictions: list[Prediction] = (
        db.query(Prediction).filter(Prediction.match_id == match.id).all()
    )
    affected_user_ids = {pred.user_id for pred in predictions}

    match.home_score = None
    match.away_score = None
    match.penalty_winner = None
    match.has_extra_time = None

    for pred in predictions:
        pred.points = None

    db.flush()

    _revert_bracket_propagation(db, match)

    if match.round_name and match.round_name.startswith("Grupo "):
        _refresh_group_knockout_slots(db, match.round_name)

    for user_id in affected_user_ids:
        _recompute_user_stats(db, user_id)

    db.commit()


# ── Bracket helpers ───────────────────────────────────────────────────────────

def _propagate_bracket(db: Session, match: Match) -> None:
    """
    After a knockout match result is saved, write the winner (and loser for semis)
    into the next round's match slot.
    Draws are resolved via penalty_winner.
    """
    mn = match.match_number
    if mn is None or match.home_score is None or match.away_score is None:
        return

    if match.home_score > match.away_score:
        winner, loser = match.home_team, match.away_team
    elif match.away_score > match.home_score:
        winner, loser = match.away_team, match.home_team
    elif match.penalty_winner:
        # Draw in knockout: penalty_winner advances
        winner = match.penalty_winner
        loser = match.away_team if match.penalty_winner == match.home_team else match.home_team
    else:
        return  # draw with no penalty_winner set yet

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


def _revert_bracket_propagation(db: Session, match: Match) -> None:
    """Restore Ganador/Perdedor placeholders in downstream knockout slots."""
    mn = match.match_number
    if mn is None:
        return

    if mn in _WINNER_SLOT:
        target_num, slot = _WINNER_SLOT[mn]
        target = db.query(Match).filter(Match.match_number == target_num).first()
        if target:
            placeholder = f"Ganador P{mn}"
            if slot == "home":
                target.home_team = placeholder
            else:
                target.away_team = placeholder
            db.flush()

    if mn in _LOSER_SLOT:
        target_num, slot = _LOSER_SLOT[mn]
        target = db.query(Match).filter(Match.match_number == target_num).first()
        if target:
            placeholder = f"Perdedor P{mn}"
            if slot == "home":
                target.home_team = placeholder
            else:
                target.away_team = placeholder
            db.flush()


def _refresh_group_knockout_slots(db: Session, group_name: str) -> None:
    """Re-propagate dieciseisavos slots when the group still has all results."""
    group_matches = db.query(Match).filter(Match.round_name == group_name).all()
    if not group_matches:
        return
    if all(m.home_score is not None and m.away_score is not None for m in group_matches):
        _propagate_group_results(db, group_name)


def _propagate_group_results(db: Session, group_name: str) -> None:
    """
    Once every match in a group has a result, compute standings and update
    Dieciseisavos placeholder team names.
    """
    group_matches = db.query(Match).filter(Match.round_name == group_name).all()
    if not group_matches:
        return

    if not all(m.home_score is not None and m.away_score is not None for m in group_matches):
        return

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

    gl = group_name.split()[-1]
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
    by scanning ALL their scored predictions.
    exact_results  = marcador exacto (5 pts base).
    partial_score_hits = ganador/empate correcto sin marcador exacto (3 pts base).
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

        match = db.get(Match, pred.match_id)
        if not match or match.home_score is None or match.away_score is None:
            continue

        if pred.predicted_home == match.home_score and pred.predicted_away == match.away_score:
            exact_results += 1
        elif _sign(pred.predicted_home - pred.predicted_away) == _sign(match.home_score - match.away_score):
            partial_score_hits += 1

    user.total_points = total_points
    user.exact_results = exact_results
    user.partial_score_hits = partial_score_hits


def recompute_all_user_stats(db: Session) -> int:
    """Recalculates leaderboard stats for every user. Returns users updated."""
    user_ids = [row[0] for row in db.query(User.id).all()]
    for user_id in user_ids:
        _recompute_user_stats(db, user_id)
    db.commit()
    return len(user_ids)
