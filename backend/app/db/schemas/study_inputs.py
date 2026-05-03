from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator, model_validator

from app.db.schemas.common import APIModel

MAX_SOURCE_IMAGE_DATA_LENGTH = 4_000_000
StudyInputType = Literal["keywords", "notes"]
SourceKind = Literal["photo", "manual"]


class TopicResponse(APIModel):
    id: str
    text: str = Field(alias="topic_text", serialization_alias="text")
    is_starred: bool


class StudyInputCreateRequest(APIModel):
    input_type: StudyInputType
    content: list[str] | str
    starred_indices: list[int] = Field(default_factory=list)
    source_kind: SourceKind | None = None
    source_preview_text: str | None = None
    source_image_ref: str | None = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: list[str] | str) -> list[str] | str:
        if isinstance(value, list):
            cleaned = [item.strip() for item in value if item.strip()]
            if not 1 <= len(cleaned) <= 10:
                raise ValueError("keywords content must include 1 to 10 items")
            if len(cleaned) != len(value):
                raise ValueError("keywords cannot contain empty items")
            return cleaned
        note = value.strip()
        if not 30 <= len(note) <= 500:
            raise ValueError("notes content must be 30 to 500 characters")
        return note

    @model_validator(mode="after")
    def validate_shape(self) -> "StudyInputCreateRequest":
        if self.input_type == "keywords" and not isinstance(self.content, list):
            raise ValueError("keywords input requires array content")
        if self.input_type == "notes" and not isinstance(self.content, str):
            raise ValueError("notes input requires string content")
        if self.source_preview_text is not None and not self.source_preview_text.strip():
            self.source_preview_text = None
        return self


class StudyInputCreateResponse(APIModel):
    study_input_id: str
    topics: list[TopicResponse]
    source_kind: SourceKind | None = None
    source_preview_text: str | None = None
    source_image_ref: str | None = None


class StudyInputSourceImageUploadRequest(APIModel):
    image_base64: str
    image_mime_type: str = "image/jpeg"


class StudyInputSourceImageUploadResponse(APIModel):
    source_image_ref: str


class StudyInputExtractRequest(APIModel):
    source_type: Literal["text", "image"]
    source_text: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "StudyInputExtractRequest":
        if self.source_type == "text":
            text = (self.source_text or "").strip()
            if len(text) < 5:
                raise ValueError("source_text must be at least 5 characters")
            if len(text) > 4000:
                raise ValueError("source_text is too large")
        if self.source_type == "image" and not self.image_base64:
            raise ValueError("image_base64 is required for image extraction")
        if self.image_base64 and len(self.image_base64) > MAX_SOURCE_IMAGE_DATA_LENGTH:
            raise ValueError("image_base64 is too large")
        if self.image_mime_type is not None and not self.image_mime_type.startswith("image/"):
            raise ValueError("image_mime_type must start with image/")
        return self


class ExtractedPointResponse(APIModel):
    text: str


class StudyInputExtractResponse(APIModel):
    source_preview: str
    points: list[ExtractedPointResponse]


StudyInputExtractJobStatus = Literal["queued", "running", "succeeded", "failed"]


class StudyInputExtractJobRequest(APIModel):
    source_type: Literal["text", "image"]
    source_text: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None


class StudyInputExtractJobResponse(APIModel):
    job_id: str
    status: StudyInputExtractJobStatus
    source_preview: str | None = None
    points: list[ExtractedPointResponse] | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime
