"""One-time script to create an admin user."""
import os
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://postgres:root@localhost:5432/polla_db")
os.environ.setdefault("SECRET_KEY", "cambia-esta-clave-secreta-en-produccion-2024")

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

db = SessionLocal()
existing = db.query(User).filter(User.username == "admin").first()
if existing:
    print("El usuario admin ya existe.")
else:
    admin = User(
        username="admin",
        email="admin@polla.com",
        hashed_password=hash_password("admin1234"),
        is_admin=True,
    )
    db.add(admin)
    db.commit()
    print("Admin creado: usuario=admin  contraseña=admin1234")
db.close()
