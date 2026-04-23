from __future__ import annotations

import base64
import hashlib
import hmac
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests

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

        response = self._request("GET", ref)
        mime_type = response.headers.get("Content-Type", self._mime_from_extension(Path(ref).suffix.lstrip(".")))
        return StoredSourceImageBlob(content=response.content, mime_type=mime_type)

    def _store_bytes(self, ref: str, content: bytes, mime_type: str) -> None:
        if self._is_local():
            path = self._local_path_for_ref(ref)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            return
        self._request("PUT", ref, body=content, content_type=mime_type)

    def _is_local(self) -> bool:
        provider = (self.settings.source_image_storage_provider or "local").strip().lower()
        return provider in {"local", "filesystem", "file"}

    def _local_path_for_ref(self, ref: str) -> Path:
        root = Path(self.settings.source_image_storage_root).resolve()
        path = (root / ref).resolve()
        if root not in path.parents and path != root:
            raise ValueError("invalid source image ref")
        return path

    def _request(
        self,
        method: str,
        ref: str,
        *,
        body: bytes | None = None,
        content_type: str | None = None,
        allow_not_found: bool = False,
    ) -> requests.Response | None:
        url = self._object_url(ref)
        headers = self._signed_headers(method, ref, body=body, content_type=content_type)
        response = requests.request(method, url, data=body, headers=headers, timeout=30)
        if allow_not_found and response.status_code == 404:
            return None
        if response.status_code >= 400:
            raise ValueError(f"source image storage request failed: {response.status_code}")
        return response

    def _object_url(self, ref: str) -> str:
        endpoint = self._require_object_setting("SOURCE_IMAGE_STORAGE_ENDPOINT_URL")
        bucket = self._require_object_setting("SOURCE_IMAGE_STORAGE_BUCKET")
        return f"{endpoint.rstrip('/')}/{bucket}/{self._object_key(ref)}"

    def _signed_headers(
        self,
        method: str,
        ref: str,
        *,
        body: bytes | None = None,
        content_type: str | None = None,
    ) -> dict[str, str]:
        endpoint = self._require_object_setting("SOURCE_IMAGE_STORAGE_ENDPOINT_URL")
        access_key = self._require_object_setting("SOURCE_IMAGE_STORAGE_ACCESS_KEY_ID")
        secret_key = self._require_object_setting("SOURCE_IMAGE_STORAGE_SECRET_ACCESS_KEY")
        region = self._require_object_setting("SOURCE_IMAGE_STORAGE_REGION")

        parsed = urlparse(endpoint)
        host = parsed.netloc
        amz_date = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        date_stamp = amz_date[:8]
        payload_hash = hashlib.sha256(body or b"").hexdigest()

        canonical_uri = f"/{self.settings.source_image_storage_bucket}/{self._object_key(ref)}"
        canonical_headers: dict[str, str] = {
            "host": host,
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
        }
        if content_type:
            canonical_headers["content-type"] = content_type

        signed_headers = ";".join(sorted(canonical_headers))
        canonical_headers_string = "".join(f"{key}:{canonical_headers[key]}\n" for key in sorted(canonical_headers))
        canonical_request = "\n".join(
            [
                method,
                canonical_uri,
                "",
                canonical_headers_string,
                signed_headers,
                payload_hash,
            ]
        )
        scope = f"{date_stamp}/{region}/s3/aws4_request"
        string_to_sign = "\n".join(
            [
                "AWS4-HMAC-SHA256",
                amz_date,
                scope,
                hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
            ]
        )
        signing_key = self._signing_key(secret_key, date_stamp, region, "s3")
        signature = hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
        authorization = (
            f"AWS4-HMAC-SHA256 Credential={access_key}/{scope}, "
            f"SignedHeaders={signed_headers}, Signature={signature}"
        )

        headers = {
            "Authorization": authorization,
            "Host": host,
            "x-amz-content-sha256": payload_hash,
            "x-amz-date": amz_date,
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

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
        return quote(ref, safe="/-_.~")

    @staticmethod
    def _validate_ref(ref: str) -> None:
        if not ref or "/" in ref or ".." in ref:
            raise ValueError("invalid source image ref")

    @staticmethod
    def _signing_key(secret_key: str, date_stamp: str, region_name: str, service_name: str) -> bytes:
        def sign(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

        k_date = sign(f"AWS4{secret_key}".encode("utf-8"), date_stamp)
        k_region = sign(k_date, region_name)
        k_service = sign(k_region, service_name)
        return sign(k_service, "aws4_request")

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
