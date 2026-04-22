from app.db.schemas.common import APIModel


class UsageLimitInfo(APIModel):
    limit: int
    used: int
    remaining: int


class UsageLimitsResponse(APIModel):
    photo_extract_daily: UsageLimitInfo
    question_generation_daily: UsageLimitInfo
    question_generation_monthly: UsageLimitInfo

