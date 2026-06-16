from datetime import datetime

from pydantic import BaseModel, model_validator


class PredictionCreate(BaseModel):
    match_id: int
    predicted_home: int
    predicted_away: int
    predicted_penalty_winner: str | None = None
    predicted_extra_time: bool | None = None

    @model_validator(mode="after")
    def scores_non_negative(self) -> "PredictionCreate":
        if self.predicted_home < 0 or self.predicted_away < 0:
            raise ValueError("Los marcadores no pueden ser negativos")
        return self


class PredictionResponse(BaseModel):
    id: int
    match_id: int
    predicted_home: int
    predicted_away: int
    predicted_penalty_winner: str | None
    predicted_extra_time: bool | None
    points: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PredictionAdminResponse(BaseModel):
    """Predicción de un usuario con nombre, para listados de solo lectura."""

    id: int
    user_id: int
    username: str
    match_id: int
    predicted_home: int
    predicted_away: int
    predicted_penalty_winner: str | None
    predicted_extra_time: bool | None
    points: int | None
    created_at: datetime
    updated_at: datetime
