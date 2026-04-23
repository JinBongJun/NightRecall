from __future__ import annotations

import base64
import re
from dataclasses import dataclass
from pathlib import Path

from app.core.config import get_settings
from app.utils.ids import make_id


DATA_URI_RE = re.compile(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", flags=re.DOTALL)


@dataclass(frozen=True, slots=True)
class StoredSourceImage:
    ref: str
    mime_type: str


class SourceImageStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def store_data_uri(self, data_uri: str) -> StoredSourceImage:
        mime_type, data = self._parse_data_uri(data_uri)
        image_id = make_id("sir")
        extension = self._mime_to_extension(mime_type)
        ref = f"{image_id}.{extension}"
        path = self._path_for_ref(ref)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(data))
        return StoredSourceImage(ref=ref, mime_type=mime_type)

    def delete(self, ref: str | None) -> None:
        if not ref:
            return
        path = self._path_for_ref(ref)
        try:
            path.unlink()
        except FileNotFoundError:
            return

    def resolve_path(self, ref: str) -> Path:
        return self._path_for_ref(ref)

    def _path_for_ref(self, ref: str) -> Path:
        root = Path(self.settings.source_image_storage_root).resolve()
        path = (root / ref).resolve()
        if root not in path.parents and path != root:
            raise ValueError("invalid source image ref")
        return path

    @staticmethod
    def _parse_data_uri(data_uri: str) -> tuple[str, str]:
        match = DATA_URI_RE.match(data_uri.strip())
        if not match:
            raise ValueError("source image must be an image data URI")
        mime_type, encoded = match.groups()
        return mime_type, encoded

    @staticmethod
    def _mime_to_extension(mime_type: str) -> str:
        if mime_type == "image/png":
            return "png"
        if mime_type in {"image/jpeg", "image/jpg"}:
            return "jpg"
        if mime_type == "image/webp":
            return "webp"
        if mime_type == "image/gif":
            return "gif"
        return "bin"
