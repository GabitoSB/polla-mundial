from sqlalchemy import Boolean, Column, Integer, LargeBinary, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # ── Leaderboard stats (pre-computed for performance) ──────────────────────
    # Criterio 1: suma total de puntos
    total_points = Column(Integer, default=0, nullable=False)
    # Criterio 2: cantidad de resultados exactos (5 pts)
    exact_results = Column(Integer, default=0, nullable=False)
    # Criterio 3: partidos con ganador/empate correcto pero sin marcador exacto (3 pts base)
    partial_score_hits = Column(Integer, default=0, nullable=False)

    avatar_data = Column(LargeBinary, nullable=True)
    avatar_content_type = Column(String(50), nullable=True)

    predictions = relationship("Prediction", back_populates="user")

    @property
    def avatar_url(self) -> str | None:
        if self.avatar_data:
            return f"/auth/avatars/{self.id}"
        return None
