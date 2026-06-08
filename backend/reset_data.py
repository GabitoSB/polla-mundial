"""
Limpieza total: elimina predicciones, partidos y usuarios (excepto admin).
Para solo borrar predicciones/resultados usar reset_predictions_results.py.
"""
import os
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:root@localhost:5432/polla_db")
os.environ.setdefault("SECRET_KEY", "cambia-esta-clave-secreta-en-produccion-2024")

from app.core.database import SessionLocal
from app.models.user import User
from app.models.match import Match
from app.models.prediction import Prediction

db = SessionLocal()

# Eliminar todas las predicciones
pred_count = db.query(Prediction).delete()

# Eliminar todos los partidos
match_count = db.query(Match).delete()

# Eliminar todos los usuarios excepto admin
user_count = db.query(User).filter(User.username != "admin").delete()

db.commit()
db.close()

print(f"Eliminados: {pred_count} predicciones, {match_count} partidos, {user_count} usuarios")
print("Usuario admin conservado.")
