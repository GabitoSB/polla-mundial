"""Cumulative leaderboard snapshots after each scored match."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User
from app.services.scoring import _sign


def _rank_users(users: list[User], stats: dict[int, dict[str, int]]) -> dict[int, int]:
    ordered = sorted(
        users,
        key=lambda u: (
            -stats[u.id]["total_points"],
            -stats[u.id]["exact_results"],
            -stats[u.id]["partial_score_hits"],
            u.username.lower(),
        ),
    )
    return {u.id: idx + 1 for idx, u in enumerate(ordered)}


def build_leaderboard_history(db: Session) -> dict:
    users = (
        db.query(User)
        .filter(User.is_active.is_(True), User.is_admin.is_(False))
        .order_by(User.username.asc())
        .all()
    )
    if not users:
        return {"snapshots": [], "players": []}

    scored_matches = (
        db.query(Match)
        .filter(Match.home_score.isnot(None), Match.away_score.isnot(None))
        .order_by(Match.match_number.asc().nullslast(), Match.start_time.asc(), Match.id.asc())
        .all()
    )

    user_ids = {u.id for u in users}
    predictions = (
        db.query(Prediction)
        .join(Match, Prediction.match_id == Match.id)
        .filter(
            Prediction.user_id.in_(user_ids),
            Prediction.points.isnot(None),
            Match.home_score.isnot(None),
            Match.away_score.isnot(None),
        )
        .all()
    )
    preds_by_user_match = {(p.user_id, p.match_id): p for p in predictions}

    stats = {
        u.id: {"total_points": 0, "exact_results": 0, "partial_score_hits": 0}
        for u in users
    }

    snapshots: list[dict] = []
    rows: list[dict] = []

    def append_snapshot(key: str, label: str, match: Match | None) -> None:
        ranks = _rank_users(users, stats)
        snapshots.append(
            {
                "key": key,
                "match_id": match.id if match else None,
                "match_number": match.match_number if match else None,
                "label": label,
                "date": match.start_time.isoformat() if match and match.start_time else None,
            }
        )
        row: dict = {"key": key, "label": label}
        for u in users:
            uid = u.id
            row[f"u{uid}"] = ranks[uid]
            row[f"u{uid}_pts"] = stats[uid]["total_points"]
        rows.append(row)

    append_snapshot("start", "Inicio", None)

    for match in scored_matches:
        for uid in user_ids:
            pred = preds_by_user_match.get((uid, match.id))
            if not pred:
                continue
            stats[uid]["total_points"] += pred.points or 0
            if pred.predicted_home == match.home_score and pred.predicted_away == match.away_score:
                stats[uid]["exact_results"] += 1
            elif _sign(pred.predicted_home - pred.predicted_away) == _sign(
                match.home_score - match.away_score
            ):
                stats[uid]["partial_score_hits"] += 1

        label = f"P{match.match_number}" if match.match_number else f"M{match.id}"
        append_snapshot(label, label, match)

    players = [
        {
            "user_id": u.id,
            "username": u.username,
            "avatar_url": u.avatar_url,
        }
        for u in users
    ]

    return {"snapshots": snapshots, "players": players, "rows": rows}
