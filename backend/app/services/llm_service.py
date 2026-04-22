import hashlib
import json
import logging
import re
from typing import Any

import requests
from requests import RequestException

from app.core.config import get_settings
from app.db.schemas.questions import QuestionOutput

logger = logging.getLogger(__name__)


class LLMService:
    """
    Prefer provider-backed question generation when configured.
    Fall back to deterministic questions when the provider is unavailable.
    """

    @classmethod
    def generate_question(
        cls,
        study_input_text: str,
        topic: str,
        variant_seed: int = 0,
        is_starred: bool = False,
    ) -> QuestionOutput:
        settings = get_settings()

        if settings.openai_api_key:
            try:
                return cls._generate_openai_question(
                    study_input_text=study_input_text,
                    topic=topic,
                    variant_seed=variant_seed,
                    is_starred=is_starred,
                )
            except Exception:
                # Avoid logging user content (topic/study_input) into production logs.
                logger.exception(
                    "question_generation: provider_failed topic_len=%s variant_seed=%s",
                    len(topic or ""),
                    variant_seed,
                )

        return cls._generate_fallback_question(topic=topic, variant_seed=variant_seed)

    @classmethod
    def _generate_openai_question(
        cls,
        study_input_text: str,
        topic: str,
        variant_seed: int,
        is_starred: bool,
    ) -> QuestionOutput:
        settings = get_settings()
        variant_brief = cls._variant_brief(variant_seed)
        study_context = cls._normalize_study_context(study_input_text)

        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_question_model,
                "input": [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    "You write NightRecall memory questions. "
                                    "Make one concrete, high-quality recall question from the user's saved learning. "
                                    "Avoid generic wording such as 'saved topic', 'what do you remember', "
                                    "'remember everything', or empty fill-in-the-blank prompts. "
                                    "The question must be answerable from the provided study input. "
                                    "Keep question_text and explanation under 180 characters each. "
                                    "Return JSON only with keys: question_type, question_text, choices, answer_index, answer_text, explanation. "
                                    "Allowed question_type values: mcq, true_false. "
                                    "For mcq, provide 4 distinct choices and one correct answer_index. "
                                    "Prefer mcq unless true/false is clearly best."
                                ),
                            }
                        ],
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    f"Focus topic: {topic}\n"
                                    f"Important topic: {'yes' if is_starred else 'no'}\n"
                                    f"Question variation goal: {variant_brief}\n"
                                    "Study input:\n"
                                    f"{study_context}\n\n"
                                    "Return one strong question in JSON only."
                                ),
                            }
                        ],
                    },
                ],
            },
            timeout=30,
        )
        try:
            response.raise_for_status()
        except RequestException as exc:
            detail = None
            if exc.response is not None:
                try:
                    payload = exc.response.json()
                    detail = payload.get("error", {}).get("message")
                except ValueError:
                    detail = exc.response.text
            raise ValueError(detail or "question generation request failed") from exc

        payload = response.json()
        output_text = cls._extract_output_text(payload)
        parsed = cls._parse_question_payload(output_text)
        validated = QuestionOutput.model_validate(
            {
                "id": "pending",
                "question_type": parsed["question_type"],
                "question_text": parsed["question_text"],
                "choices": parsed.get("choices"),
                "answer_index": parsed.get("answer_index"),
                "answer_text": parsed.get("answer_text"),
                "explanation": parsed["explanation"],
            }
        )
        # We intentionally do not ship free-form or fill-in-the-blank answers yet.
        if validated.question_type == "fill_blank":
            raise ValueError("fill_blank_disabled")
        logger.info(
            "question_generation: provider_success topic_len=%s variant_seed=%s type=%s",
            len(topic or ""),
            variant_seed,
            validated.question_type,
        )
        return validated

    @staticmethod
    def _normalize_study_context(study_input_text: str) -> str:
        text = study_input_text.strip()
        if not text:
            return ""

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None

        if isinstance(parsed, list):
            lines = [f"- {str(item).strip()}" for item in parsed if str(item).strip()]
            return "\n".join(lines)[:1200]

        return text[:1200]

    @staticmethod
    def _variant_brief(variant_seed: int) -> str:
        variants = [
            "test the main concrete detail",
            "test a contrast or distinction inside the material",
            "test one exact phrase or short answer the learner should recall",
        ]
        return variants[variant_seed % len(variants)]

    @staticmethod
    def _extract_output_text(payload: dict[str, Any]) -> str:
        output_text = payload.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text

        output = payload.get("output")
        if isinstance(output, list):
            fragments: list[str] = []
            for item in output:
                if not isinstance(item, dict):
                    continue
                content = item.get("content")
                if not isinstance(content, list):
                    continue
                for chunk in content:
                    if not isinstance(chunk, dict):
                        continue
                    text = chunk.get("text")
                    if isinstance(text, str):
                        fragments.append(text)
            if fragments:
                return "".join(fragments)

        raise ValueError("question generation returned no text output")

    @staticmethod
    def _parse_question_payload(output_text: str) -> dict[str, Any]:
        candidates = [output_text.strip()]

        fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", output_text, flags=re.DOTALL)
        if fenced_match:
            candidates.append(fenced_match.group(1).strip())

        json_match = re.search(r"\{.*\}", output_text, flags=re.DOTALL)
        if json_match:
            candidates.append(json_match.group(0).strip())

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed

        raise ValueError("question generation returned invalid JSON")

    @staticmethod
    def _generate_fallback_question(topic: str, variant_seed: int = 0) -> QuestionOutput:
        suffix = int(hashlib.sha256(f"{topic}:{variant_seed}".encode()).hexdigest(), 16) % 2
        if suffix == 0:
            return QuestionOutput(
                id="pending",
                question_type="mcq",
                question_text=f"Which detail matches {topic}?",
                choices=[topic, f"Not {topic}", "A different topic", "Not mentioned"],
                answer_index=0,
                answer_text=None,
                explanation=f"{topic} was one of the saved points from your learning.",
            )
        return QuestionOutput(
            id="pending",
            question_type="true_false",
            question_text=f"True or false: {topic} was part of this learning.",
            choices=["True", "False"],
            answer_index=0,
            answer_text=None,
            explanation=f"{topic} came directly from the saved learning points.",
        )
