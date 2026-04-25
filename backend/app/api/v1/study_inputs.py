import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.api.v1.rate_limit import rate_limit_user
from app.db.models.study import StudyInput
from app.db.models.user import User
from app.db.schemas.study_inputs import (
    StudyInputExtractJobResponse,
    StudyInputCreateRequest,
    StudyInputCreateResponse,
    StudyInputExtractRequest,
    StudyInputExtractResponse,
    StudyInputSourceImageUploadRequest,
    StudyInputSourceImageUploadResponse,
)
from app.services.study_extract_job_service import StudyInputExtractJobService
from app.services.study_extract_service import StudyExtractService
from app.services.analytics_service import AnalyticsService
from app.services.source_image_storage_service import SourceImageStorageService
from app.services.study_input_service import StudyInputService
from app.services.usage_limit_service import UsageLimitService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/source-images", response_model=StudyInputSourceImageUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_source_image(
    payload: StudyInputSourceImageUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyInputSourceImageUploadResponse:
    storage = SourceImageStorageService()
    try:
        stored = storage.store_data_uri(f"data:{payload.image_mime_type};base64,{payload.image_base64}")
    except ValueError as exc:
        logger.exception("study_inputs.source_image.upload_failed detail=%s", str(exc))
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    AnalyticsService(db).record(
        name="study_inputs.source_image.uploaded",
        user_id=current_user.id,
        request_id=None,
        props={"mime_type": payload.image_mime_type, "ref": stored.ref},
    )
    return StudyInputSourceImageUploadResponse(source_image_ref=stored.ref)


@router.get("/source-images/{source_image_ref}")
def get_source_image(
    source_image_ref: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    storage = SourceImageStorageService()
    if not storage.exists(source_image_ref):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="source image not found")

    owned_image = db.scalar(
        select(StudyInput.id).where(
            StudyInput.user_id == current_user.id,
            StudyInput.source_image_ref == source_image_ref,
        )
    )
    if not owned_image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="source image not found")
    blob = storage.download(source_image_ref)
    return Response(content=blob.content, media_type=blob.mime_type)


@router.post("/extract", response_model=StudyInputExtractResponse)
def extract_study_input(
    payload: StudyInputExtractRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_user(endpoint="study_inputs.extract", limit=15, window_seconds=60)),
) -> StudyInputExtractResponse:
    logger.info(
        "study_inputs.extract route source_type=%s has_text=%s has_image=%s image_mime_type=%s",
        payload.source_type,
        bool(payload.source_text),
        bool(payload.image_base64),
        payload.image_mime_type,
    )
    limit_service = UsageLimitService(db)
    should_record_usage = payload.source_type == "image"
    if should_record_usage:
        try:
            limit_service.assert_can_extract_photo(current_user)
        except ValueError as exc:
            AnalyticsService(db).record(
                name="limit.hit",
                user_id=current_user.id,
                request_id=getattr(request.state, "request_id", None),
                props={"endpoint": "study_inputs.extract", "reason": str(exc)},
            )
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    service = StudyExtractService()
    try:
        response = service.extract(payload)
    except ValueError as exc:
        logger.exception("study_inputs.extract value_error detail=%s", str(exc))
        AnalyticsService(db).record(
            name="study_inputs.extract.failed",
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props={"source_type": payload.source_type},
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    if should_record_usage:
        limit_service.record_photo_extract(current_user.id)
        db.commit()

    AnalyticsService(db).record(
        name="study_inputs.extract.success",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={
            "source_type": payload.source_type,
            "points": len(response.points),
        },
    )
    return response


@router.post("/extract/jobs", response_model=StudyInputExtractJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_extract_job(
    payload: StudyInputExtractRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_user(endpoint="study_inputs.extract_jobs", limit=15, window_seconds=60)),
) -> StudyInputExtractJobResponse:
    logger.info(
        "study_inputs.extract.jobs route source_type=%s has_text=%s has_image=%s image_mime_type=%s",
        payload.source_type,
        bool(payload.source_text),
        bool(payload.image_base64),
        payload.image_mime_type,
    )
    service = StudyInputExtractJobService(db)
    try:
        response = service.create_job(current_user.id, payload, background_tasks)
    except ValueError as exc:
        AnalyticsService(db).record(
            name="study_inputs.extract.job.failed",
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props={"source_type": payload.source_type},
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    AnalyticsService(db).record(
        name="study_inputs.extract.job.created",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"source_type": payload.source_type},
    )
    return response


@router.get("/extract/jobs/{job_id}", response_model=StudyInputExtractJobResponse)
def get_extract_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyInputExtractJobResponse:
    service = StudyInputExtractJobService(db)
    try:
        return service.get_job(current_user.id, job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("", response_model=StudyInputCreateResponse, status_code=status.HTTP_201_CREATED)
def create_study_input(
    payload: StudyInputCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyInputCreateResponse:
    service = StudyInputService(db)
    try:
        response = service.create_study_input(current_user.id, payload)
    except ValueError as exc:
        AnalyticsService(db).record(
            name="study_inputs.save.failed",
            user_id=current_user.id,
            request_id=getattr(request.state, "request_id", None),
            props={"input_type": payload.input_type, "source_kind": payload.source_kind},
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    AnalyticsService(db).record(
        name="study_inputs.saved",
        user_id=current_user.id,
        request_id=getattr(request.state, "request_id", None),
        props={
            "input_type": payload.input_type,
            "source_kind": payload.source_kind,
            "topics": len(response.topics),
            "starred": len(payload.starred_indices),
        },
    )
    return response


@router.post("/{study_input_id}/redact-source", status_code=status.HTTP_204_NO_CONTENT)
def redact_study_input_source(
    study_input_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    service = StudyInputService(db)
    try:
        service.redact_study_input_source(current_user.id, study_input_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
