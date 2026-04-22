from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.api.v1.rate_limit import rate_limit_user
from app.db.models.user import User
from app.db.schemas.questions import QuestionGenerateRequest, QuestionGenerateResponse
from app.services.analytics_service import AnalyticsService
from app.services.question_service import QuestionService

router = APIRouter()


@router.post("/generate", response_model=QuestionGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_questions(
    payload: QuestionGenerateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_user(endpoint="questions.generate", limit=10, window_seconds=60)),
) -> QuestionGenerateResponse:
    service = QuestionService(db)
    try:
        response = service.generate_questions(current_user.id, payload)
    except ValueError as exc:
        name = "questions.generate.failed"
        props = {"count_requested": payload.count}
        if str(exc).endswith("_limit_reached"):
            name = "limit.hit"
            props = {"endpoint": "questions.generate", "reason": str(exc)}
        AnalyticsService(db).record(
            name=name,
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props=props,
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    AnalyticsService(db).record(
        name="questions.generate.success",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"count_requested": payload.count, "count_returned": len(response.questions)},
    )
    return response
