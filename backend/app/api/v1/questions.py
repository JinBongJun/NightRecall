from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.api.v1.rate_limit import rate_limit_user
from app.db.models.user import User
from app.db.schemas.questions import (
    QuestionGenerateRequest,
    QuestionGenerateResponse,
    QuestionGenerationJobResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.question_generation_job_service import QuestionGenerationJobService
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


@router.post("/jobs", response_model=QuestionGenerationJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_question_generation_job(
    payload: QuestionGenerateRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_user(endpoint="questions.generate.jobs", limit=10, window_seconds=60)),
) -> QuestionGenerationJobResponse:
    service = QuestionGenerationJobService(db)
    try:
        response = service.create_job(current_user.id, payload, background_tasks)
    except ValueError as exc:
        name = "questions.generate.job.failed"
        props = {"count_requested": payload.count}
        if str(exc).endswith("_limit_reached"):
            name = "limit.hit"
            props = {"endpoint": "questions.generate.jobs", "reason": str(exc)}
        AnalyticsService(db).record(
            name=name,
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props=props,
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    AnalyticsService(db).record(
        name="questions.generate.job.created",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"count_requested": payload.count, "job_id": response.job_id},
    )
    return response


@router.get("/jobs/{job_id}", response_model=QuestionGenerationJobResponse)
def get_question_generation_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuestionGenerationJobResponse:
    service = QuestionGenerationJobService(db)
    try:
        return service.get_job(current_user.id, job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
