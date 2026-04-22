from pydantic import Field, model_validator

from app.db.schemas.common import APIModel
from app.db.schemas.questions import QuestionGenerateResponse, QuestionOutput
from app.db.schemas.study_inputs import TopicResponse


class ReviewQuestionResponse(APIModel):
    mode: str
    question: QuestionOutput


class TonightTopicsResponse(APIModel):
    topics: list[TopicResponse]


class PickTopicQuestionRequest(APIModel):
    topic_id: str


class SavedTopicSourceResponse(APIModel):
    topic_id: str
    study_input_id: str
    input_type: str
    raw_content: str
    source_kind: str | None = None
    source_preview_text: str | None = None
    source_image_data: str | None = None
    topics: list[TopicResponse]


class SavedStudyInputSummaryResponse(APIModel):
    study_input_id: str
    input_type: str
    source_kind: str | None = None
    source_preview_text: str | None = None
    source_image_data: str | None = None
    title: str
    preview: str
    bookmarked_count: int
    topic_id: str


class SavedStudyInputsResponse(APIModel):
    items: list[SavedStudyInputSummaryResponse]


class SavedStudyInputDetailResponse(APIModel):
    study_input_id: str
    input_type: str
    raw_content: str
    source_kind: str | None = None
    source_preview_text: str | None = None
    source_image_data: str | None = None
    topics: list[TopicResponse]


class GenerateFromSavedTopicRequest(APIModel):
    topic_id: str
    selected_topic_ids: list[str] = Field(default_factory=list)
    count: int = Field(default=1, ge=1, le=3)


class GenerateFromSavedInputRequest(APIModel):
    study_input_id: str
    selected_topic_ids: list[str] = Field(default_factory=list)
    count: int = Field(default=1, ge=1, le=3)


class GenerateFromSavedTopicResponse(QuestionGenerateResponse):
    pass


class GenerateFromSavedInputResponse(QuestionGenerateResponse):
    pass


class AnswerSubmitRequest(APIModel):
    question_id: str
    selected_index: int | None = None
    selected_text: str | None = None
    response_time_ms: int = Field(default=0, ge=0, le=120000)

    @model_validator(mode="after")
    def validate_selection(self) -> "AnswerSubmitRequest":
        if self.selected_index is None and self.selected_text is None:
            raise ValueError("selected_index or selected_text is required")
        return self


class AnswerSubmitResponse(APIModel):
    is_correct: bool
    correct_index: int | None
    correct_text: str | None
    explanation: str
    current_streak: int
