from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    # Official FIFA match number (1-104)
    match_number = Column(Integer, nullable=True, index=True)

    # Identifiers
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)

    # Group stage / round info (e.g. "Group A", "Quarter-final")
    round_name = Column(String(100), nullable=True)

    # UTC datetime when the match kicks off — predictions are locked at this time
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)

    # Real result — NULL while the match has not been played yet
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    # For knockout matches that end in a draw (penalties): name of the team that advances
    penalty_winner = Column(String(100), nullable=True)

    # For knockout matches: whether the match went to extra time (True/False, None = not set)
    has_extra_time = Column(Boolean, nullable=True)

    predictions = relationship("Prediction", back_populates="match")
