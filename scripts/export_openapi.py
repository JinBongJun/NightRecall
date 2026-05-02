import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
OUTPUT_PATH = ROOT_DIR / "api" / "openapi.json"


def main() -> None:
    sys.path.insert(0, str(BACKEND_DIR))

    from app.main import create_app

    app = create_app()
    schema = app.openapi()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
