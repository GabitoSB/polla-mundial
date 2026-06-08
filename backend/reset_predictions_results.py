"""
Borra todas las predicciones y resultados de partidos; reinicia puntos del ranking.
Conserva usuarios y el calendario de partidos.

Uso local:  python reset_predictions_results.py
Uso prod:    Cloud Run Job con `python reset_predictions_results.py`
"""
from sqlalchemy import update

from app.core.database import SessionLocal
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.user import User


def main() -> None:
    db = SessionLocal()
    try:
        pred_count = db.query(Prediction).delete()
        match_count = db.execute(
            update(Match).values(
                home_score=None,
                away_score=None,
                penalty_winner=None,
                has_extra_time=None,
            )
        ).rowcount
        user_count = db.execute(
            update(User).values(
                total_points=0,
                exact_results=0,
                partial_score_hits=0,
            )
        ).rowcount
        db.commit()
        print(
            f"Listo: {pred_count} predicciones eliminadas, "
            f"{match_count} partidos sin resultado, "
            f"{user_count} usuarios con puntos en 0."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
