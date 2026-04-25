from __future__ import annotations

import base64
import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import get_settings
from app.utils.ids import make_id


DATA_URI_RE = re.compile(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", flags=re.DOTALL)


@dataclass(frozen=True, slots=True)
class StoredSourceImage:
    ref: str
    mime_type: str


@dataclass(frozen=True, slots=True)
class StoredSourceImageBlob:
    content: bytes
    mime_type: str


class SourceImageStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def store_data_uri(self, data_uri: str) -> StoredSourceImage:
        mime_type, data = self._parse_data_uri(data_uri)
        image_id = make_id("sir")
        extension = self._mime_to_extension(mime_type)
        ref = f"{image_id}.{extension}"
        self._store_bytes(ref, base64.b64decode(data), mime_type)
        return StoredSourceImage(ref=ref, mime_type=mime_type)

    def delete(self, ref: str | None) -> None:
        if not ref:
            return
        if self._is_local():
            path = self._local_path_for_ref(ref)
            try:
                path.unlink()
            except FileNotFoundError:
                return
            return
        self._request("DELETE", ref)

    def exists(self, ref: str) -> bool:
        if self._is_local():
            return self._local_path_for_ref(ref).exists()
        response = self._request("HEAD", ref, allow_not_found=True)
        return response is not None

    def download(self, ref: str) -> StoredSourceImageBlob:
        if self._is_local():
            path = self._local_path_for_ref(ref)
            if not path.exists():
                raise ValueError("source image not found")
            mime_type = self._mime_from_extension(path.suffix.lstrip("."))
            return StoredSourceImageBlob(content=path.read_bytes(), mime_type=mime_type)

        try:
            response = self._object_client().get_object(Bucket=self._bucket(), Key=self._object_key(ref))
        except ClientError as exc:
            raise ValueError(self._client_error_message(exc)) from exc
        mime_type = response.get("ContentType") or self._mime_from_extension(Path(ref).suffix.lstrip("."))
        return StoredSourceImageBlob(content=response["Body"].read(), mime_type=mime_type)

    def _store_bytes(self, ref: str, content: bytes, mime_type: str) -> None:
        if self._is_local():
            path = self._local_path_for_ref(ref)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            return
        try:
            self._object_client().put_object(Bucket=self._bucket(), Key=self._object_key(ref), Body=content, ContentType=mime_type)
        except ClientError as exc:
            raise ValueError(self._client_error_message(exc)) from exc

    def _is_local(self) -> bool:
        provider = (self.settings.source_image_storage_provider or "local").strip().lower()
        return provider in {"local", "filesystem", "file"}

    def _local_path_for_ref(self, ref: str) -> Path:
        root = Path(self.settings.source_image_storage_root).resolve()
        path = (root / ref).resolve()
        if root not in path.parents and path != root:
            raise ValueError("invalid source image ref")
        return path

    def _request(self, method: str, ref: str, *, allow_not_found: bool = False) -> object | None:
        client = self._object_client()
        try:
            if method == "HEAD":
                return client.head_object(Bucket=self._bucket(), Key=self._object_key(ref))
            if method == "DELETE":
                return client.delete_object(Bucket=self._bucket(), Key=self._object_key(ref))
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if allow_not_found and error_code in {"404", "NoSuchKey", "NotFound"}:
                return None
            raise ValueError(self._client_error_message(exc)) from exc
        raise ValueError(f"unsupported source image storage method: {method}")

    def _object_client(self):
        endpoint = self._normalized_endpoint_url()
        access_key = self._require_object_setting("SOURCE_IMAGE_STORAGE_ACCESS_KEY_ID")
        secret_key = self._require_object_setting("SOURCE_IMAGE_STORAGE_SECRET_ACCESS_KEY")
        region = self._require_object_setting("SOURCE_IMAGE_STORAGE_REGION")
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(signature_version="s3v4"),
        )

    def _bucket(self) -> str:
        return self._require_object_setting("SOURCE_IMAGE_STORAGE_BUCKET")

    def _normalized_endpoint_url(self) -> str:
        endpoint = self._require_object_setting("SOURCE_IMAGE_STORAGE_ENDPOINT_URL").strip()
        parsed = urlparse(endpoint)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("SOURCE_IMAGE_STORAGE_ENDPOINT_URL must be an absolute URL")
        return urlunparse((parsed.scheme, parsed.netloc, "", "", "", ""))

    def _require_object_setting(self, name: str) -> str:
        value = getattr(self.settings, self._settings_attr_name(name), None)
        if not value:
            raise ValueError(f"{name} is required for object storage")
        return str(value)

    @staticmethod
    def _settings_attr_name(name: str) -> str:
        return name.lower()

    def _object_key(self, ref: str) -> str:
        self._validate_ref(ref)
        return ref

    @staticmethod
    def _client_error_message(exc: ClientError) -> str:
        error_code = exc.response.get("Error", {}).get("Code")
        return f"source image storage request failed: {error_code or 'client_error'}"

    @staticmethod
    def _validate_ref(ref: str) -> None:
        if not ref or "/" in ref or ".." in ref:
            raise ValueError("invalid source image ref")

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

    @staticmethod
    def _mime_from_extension(extension: str) -> str:
        if extension == "png":
            return "image/png"
        if extension in {"jpg", "jpeg"}:
            return "image/jpeg"
        if extension == "webp":
            return "image/webp"
        if extension == "gif":
            return "image/gif"
        return "application/octet-stream"
