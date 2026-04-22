import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.db.models.user import User
from app.db.schemas.review import (
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    GenerateFromSavedInputRequest,
    GenerateFromSavedInputResponse,
    GenerateFromSavedTopicRequest,
    GenerateFromSavedTopicResponse,
    PickTopicQuestionRequest,
    ReviewQuestionResponse,
    SavedStudyInputDetailResponse,
    SavedStudyInputsResponse,
    SavedTopicSourceResponse,
    TonightTopicsResponse,
)
from app.services.review_service import ReviewService
from app.services.analytics_service import AnalyticsService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/tonight", response_model=ReviewQuestionResponse)
def get_tonight_question(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewQuestionResponse:
    service = ReviewService(db)
    question = service.get_tonight_question(current_user.id)
    if not question:
        logger.info("review.tonight route_404 user_id=%s detail=%s", current_user.id, "No question available for tonight")
        AnalyticsService(db).record(
            name="review.tonight.miss",
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props=None,
        )
        raise HTTPException(status_code=404, detail="No question available for tonight")
    AnalyticsService(db).record(
        name="review.tonight.hit",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"mode": question.mode},
    )
    return question


@router.get("/pick-topics", response_model=TonightTopicsResponse)
def get_pickable_topics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TonightTopicsResponse:
    return ReviewService(db).get_pickable_topics(current_user.id)


@router.get("/saved-inputs", response_model=SavedStudyInputsResponse)
def get_saved_inputs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedStudyInputsResponse:
    return ReviewService(db).list_saved_inputs(current_user.id)


@router.post("/from-topic", response_model=ReviewQuestionResponse)
def get_question_from_topic(
    payload: PickTopicQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReviewQuestionResponse:
    question = ReviewService(db).get_question_from_topic(current_user.id, payload.topic_id)
    if not question:
        raise HTTPException(status_code=404, detail="No question found for topic")
    return question


@router.get("/topic/{topic_id}/source", response_model=SavedTopicSourceResponse)
def get_saved_topic_source(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedTopicSourceResponse:
    try:
        return ReviewService(db).get_saved_topic_source(current_user.id, topic_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/saved-input/{study_input_id}", response_model=SavedStudyInputDetailResponse)
def get_saved_input_detail(
    study_input_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedStudyInputDetailResponse:
    try:
        return ReviewService(db).get_saved_input_detail(current_user.id, study_input_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/from-saved-topic", response_model=GenerateFromSavedTopicResponse)
def generate_questions_from_saved_topic(
    payload: GenerateFromSavedTopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GenerateFromSavedTopicResponse:
    try:
        return ReviewService(db).generate_questions_from_saved_topic(
            current_user.id,
            payload.topic_id,
            payload.selected_topic_ids,
            payload.count,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/from-saved-input", response_model=GenerateFromSavedInputResponse)
def generate_questions_from_saved_input(
    payload: GenerateFromSavedInputRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GenerateFromSavedInputResponse:
    try:
        return ReviewService(db).generate_questions_from_saved_input(
            current_user.id,
            payload.study_input_id,
            payload.selected_topic_ids,
            payload.count,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/topic/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        ReviewService(db).delete_topic(current_user.id, topic_id)
    except ValueError as exc:
        message = str(exc)
        raise HTTPException(status_code=404 if message == "topic not found" else 422, detail=message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/saved-input/{study_input_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_input(
    study_input_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        ReviewService(db).delete_saved_input(current_user.id, study_input_id)
    except ValueError as exc:
        message = str(exc)
        raise HTTPException(status_code=404 if message == "study input not found" else 422, detail=message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/answer", response_model=AnswerSubmitResponse)
def submit_answer(
    payload: AnswerSubmitRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnswerSubmitResponse:
    try:
        response = ReviewService(db).submit_answer(current_user.id, payload)
    except ValueError as exc:
        AnalyticsService(db).record(
            name="review.answer.failed",
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props={"response_time_ms": payload.response_time_ms},
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    AnalyticsService(db).record(
        name="review.answer",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={
            "is_correct": response.is_correct,
            "response_time_ms": payload.response_time_ms,
            "current_streak": response.current_streak,
        },
    )
    return response
