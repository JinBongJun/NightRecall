from app.db.schemas.common import APIModel
from app.db.schemas.users import UserResponse


class MeResponse(APIModel):
    user: UserResponse
