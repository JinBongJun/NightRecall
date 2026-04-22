from app.core.security import create_access_token, create_refresh_token, decode_token, hash_token, verify_token_hash


def test_access_token_round_trip() -> None:
    token = create_access_token("usr_test")
    payload = decode_token(token)
    assert payload["sub"] == "usr_test"
    assert payload["type"] == "access"


def test_refresh_token_round_trip() -> None:
    token = create_refresh_token("usr_test", "ses_test")
    payload = decode_token(token)
    assert payload["sub"] == "usr_test"
    assert payload["sid"] == "ses_test"
    assert payload["type"] == "refresh"


def test_token_hash_verification() -> None:
    raw_token = "refresh-token-value"
    hashed = hash_token(raw_token)
    assert verify_token_hash(raw_token, hashed) is True
    assert verify_token_hash("different-token", hashed) is False
