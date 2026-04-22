import json
import logging
import re
from typing import Any

import requests
from requests import RequestException

from app.core.config import get_settings
from app.db.schemas.study_inputs import ExtractedPointResponse, StudyInputExtractRequest, StudyInputExtractResponse
from app.services.topic_service import TopicService

logger = logging.getLogger(__name__)


class StudyExtractService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def extract(self, payload: StudyInputExtractRequest) -> StudyInputExtractResponse:
        if payload.source_type == "text":
            assert payload.source_text is not None
            source = payload.source_text.strip()
            points = self._extract_from_text(source)
            logger.info("study_extract:text success source_len=%s points=%s", len(source), len(points))
            return StudyInputExtractResponse(
                source_preview=source[:280],
                points=[ExtractedPointResponse(text=point) for point in points],
            )

        assert payload.image_base64 is not None
        image_mime_type = payload.image_mime_type or "image/jpeg"
        logger.info(
            "study_extract:image start image_base64_len=%s image_mime_type=%s",
            len(payload.image_base64),
            image_mime_type,
        )
        points = self._extract_from_image(payload.image_base64, image_mime_type)
        logger.info("study_extract:image success points=%s", len(points))
        return StudyInputExtractResponse(
            source_preview="Photo capture",
            points=[ExtractedPointResponse(text=point) for point in points],
        )

    def _extract_from_text(self, source_text: str) -> list[str]:
        points = TopicService.extract_topics_from_note(source_text)
        cleaned = self._clean_points(points)
        if cleaned:
            logger.debug("study_extract:text topic_service_points=%s cleaned=%s", len(points), len(cleaned))
            return cleaned

        fallback = [part.strip() for part in re.split(r"\n|[.;]", source_text) if part.strip()]
        fallback_cleaned = self._clean_points(fallback) or [source_text[:90].strip()]
        logger.debug("study_extract:text fallback_points=%s cleaned=%s", len(fallback), len(fallback_cleaned))
        return fallback_cleaned

    def _extract_from_image(self, image_base64: str, image_mime_type: str) -> list[str]:
        if not self.settings.openai_api_key:
            logger.error("study_extract:image missing_openai_api_key")
            raise ValueError("photo extraction is not configured on the server")

        try:
            response = requests.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.openai_vision_model,
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": (
                                        "Extract 3 to 6 concise study points from this image. "
                                        "Use only visible content. Return JSON only in the form "
                                        '{"points":["..."]}.'
                                    ),
                                },
                                {
                                    "type": "input_image",
                                    "image_url": f"data:{image_mime_type};base64,{image_base64}",
                                },
                            ],
                        }
                    ],
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            logger.debug("study_extract:image openai_response_keys=%s", sorted(data.keys()))
        except RequestException as exc:
            detail = None
            if exc.response is not None:
                try:
                    payload = exc.response.json()
                    detail = payload.get("error", {}).get("message")
                except ValueError:
                    detail = exc.response.text
            logger.exception("study_extract:image request_failed detail=%s", detail or "photo extraction request failed")
            raise ValueError(detail or "photo extraction request failed") from exc

        output_text = self._extract_output_text(data)
        logger.debug("study_extract:image output_text_preview=%r", output_text[:240])
        points = self._parse_points(output_text)
        logger.debug("study_extract:image parsed_points=%s", len(points))
        cleaned = self._clean_points(points)
        if not cleaned:
            logger.warning("study_extract:image no_usable_points parsed_points=%s output_preview=%r", len(points), output_text[:240])
            raise ValueError("vision extraction returned no usable points")
        return cleaned

    def _extract_output_text(self, payload: dict[str, Any]) -> str:
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

        logger.warning("study_extract:image no_text_output payload_keys=%s", sorted(payload.keys()))
        raise ValueError("vision extraction returned no text output")

    def _clean_points(self, points: list[str]) -> list[str]:
        deduped: list[str] = []
        seen: set[str] = set()
        for point in points:
            cleaned = re.sub(r"\s+", " ", point).strip(" -•\n\t")
            if len(cleaned) < 3:
                continue
            if len(cleaned) > 120:
                cleaned = f"{cleaned[:117].strip()}..."
            key = cleaned.casefold()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(cleaned)
            if len(deduped) >= 6:
                break
        return deduped

    def _parse_points(self, output_text: str) -> list[str]:
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
            points = parsed.get("points") if isinstance(parsed, dict) else None
            if isinstance(points, list):
                return [str(point) for point in points]

        line_points = [
            re.sub(r"^[-*•\d\.\)\s]+", "", line).strip()
            for line in output_text.splitlines()
            if line.strip()
        ]
        if line_points:
            logger.debug("study_extract:image using_line_fallback line_points=%s", len(line_points))
            return line_points

        logger.warning("study_extract:image invalid_shape output_preview=%r", output_text[:240])
        raise ValueError("vision extraction returned invalid shape")
