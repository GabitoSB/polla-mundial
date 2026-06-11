"""
Recalcula total_points, exact_results y partial_score_hits de todos los usuarios.
Útil tras cambiar la lógica de conteo o corregir datos.

Uso local:  python recompute_leaderboard.py
Uso prod:    Cloud Run Job con `python recompute_leaderboard.py`
"""
from app.core.database import SessionLocal
from app.services.scoring import recompute_all_user_stats


def main() -> None:
    db = SessionLocal()
    try:
        count = recompute_all_user_stats(db)
        print(f"Listo: estadísticas recalculadas para {count} usuarios.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
