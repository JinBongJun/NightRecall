from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator, model_validator

from app.db.schemas.common import APIModel


QuestionType = Literal["mcq", "true_false", "fill_blank"]
QuestionGenerationJobStatus = Literal["queued", "running", "succeeded", "failed"]


class QuestionGenerateRequest(APIModel):
    study_input_id: str
    count: int = Field(default=1, ge=1, le=3)


class QuestionOutput(APIModel):
    id: str
    question_type: QuestionType
    question_text: str = Field(min_length=1, max_length=180)
    choices: list[str] | None = None
    answer_index: int | None = None
    answer_text: str | None = None
    explanation: str = Field(min_length=1, max_length=180)
    resurface_reason: Literal["missed_before"] | None = None

    @field_validator("choices")
    @classmethod
    def validate_choices(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        if not 2 <= len(value) <= 4:
            raise ValueError("mcq choices must contain 2 to 4 items")
        if len(set(value)) != len(value):
            raise ValueError("mcq choices must be unique")
        return value

    @model_validator(mode="after")
    def validate_contract(self) -> "QuestionOutput":
        if self.question_type == "mcq":
            if self.choices is None or self.answer_index is None:
                raise ValueError("mcq requires choices and answer_index")
            if not 0 <= self.answer_index < len(self.choices):
                raise ValueError("answer_index is out of range")
        if self.question_type == "fill_blank" and not self.answer_text:
            raise ValueError("fill_blank requires answer_text")
        return self


class QuestionGenerateResponse(APIModel):
    questions: list[QuestionOutput]


class QuestionGenerationJobResponse(APIModel):
    job_id: str
    status: QuestionGenerationJobStatus
    questions: list[QuestionOutput] | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime
