from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    # One prediction per (user, match) pair
    __table_args__ = (UniqueConstraint("user_id", "match_id", name="uq_user_match"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)

    # What the user predicted
    predicted_home = Column(Integer, nullable=False)
    predicted_away = Column(Integer, nullable=False)

    # For knockout matches: predicted winner on penalties (only relevant when predicted score is a draw)
    predicted_penalty_winner = Column(String(100), nullable=True)

    # For knockout matches: whether the user predicts extra time (True) or not (False)
    predicted_extra_time = Column(Boolean, nullable=True)

    # Points awarded after the match result is entered (NULL = not yet scored)
    points = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="predictions")
    match = relationship("Match", back_populates="predictions")
