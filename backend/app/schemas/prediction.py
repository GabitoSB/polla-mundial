from datetime import datetime

from pydantic import BaseModel, model_validator


class PredictionCreate(BaseModel):
    match_id: int
    predicted_home: int
    predicted_away: int

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
    points: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
