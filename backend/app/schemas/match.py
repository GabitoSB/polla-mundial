from datetime import datetime

from pydantic import BaseModel


class MatchResponse(BaseModel):
    id: int
    home_team: str
    away_team: str
    round_name: str | None
    start_time: datetime
    home_score: int | None
    away_score: int | None

    model_config = {"from_attributes": True}


class MatchCreate(BaseModel):
    home_team: str
    away_team: str
    round_name: str | None = None
    start_time: datetime


class MatchResultUpdate(BaseModel):
    home_score: int
    away_score: int
