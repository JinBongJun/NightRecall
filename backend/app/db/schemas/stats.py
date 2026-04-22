from app.db.schemas.common import APIModel


class StatsResponse(APIModel):
    current_streak: int
    total_answered: int
    correct_count: int
    accuracy: float
    recent_wrong_topics: list[str]
    answered_today: bool
    answered_dates_this_month: list[str]
