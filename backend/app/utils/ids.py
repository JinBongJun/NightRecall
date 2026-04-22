import secrets


def make_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"
