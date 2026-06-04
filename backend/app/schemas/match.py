from datetime import datetime

from pydantic import BaseModel


class MatchResponse(BaseModel):
    id: int
    match_number: int | None
    home_team: str
    away_team: str
    round_name: str | None
    start_time: datetime
    home_score: int | None
    away_score: int | None
    penalty_winner: str | None
    has_extra_time: bool | None

    model_config = {"from_attributes": True}


class MatchCreate(BaseModel):
    match_number: int | None = None
    home_team: str
    away_team: str
    round_name: str | None = None
    start_time: datetime


class MatchResultUpdate(BaseModel):
    home_score: int
    away_score: int
    penalty_winner: str | None = None
    has_extra_time: bool | None = None


class MatchScheduleUpdate(BaseModel):
    start_time: datetime
