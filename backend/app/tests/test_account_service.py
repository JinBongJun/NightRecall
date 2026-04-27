from types import SimpleNamespace

from app.services.account_service import AccountService


class FakeScalarResult:
    def __init__(self, values: list[str | None]) -> None:
        self.values = values

    def all(self) -> list[str | None]:
        return self.values


class FakeSession:
    def __init__(self) -> None:
        self.calls: list[object] = []
        self.scalar_calls: list[object] = []
        self.did_commit = False

    def scalars(self, statement):
        self.scalar_calls.append(statement)
        return FakeScalarResult(["sir_one.jpg", "sir_two.png", "sir_one.jpg"])

    def execute(self, statement) -> None:
        self.calls.append(statement)

    def commit(self) -> None:
        self.did_commit = True


class FakeSourceImageStorage:
    def __init__(self) -> None:
        self.deleted_refs: list[str] = []

    def delete(self, ref: str | None) -> None:
        if ref:
            self.deleted_refs.append(ref)


def test_delete_user_account_executes_full_cleanup() -> None:
    db = FakeSession()
    storage = FakeSourceImageStorage()
    service = AccountService(db, source_image_storage=storage)  # type: ignore[arg-type]
    service.delete_user_account(SimpleNamespace(id="usr_123"))

    assert len(db.scalar_calls) == 1
    assert sorted(storage.deleted_refs) == ["sir_one.jpg", "sir_two.png"]
    assert len(db.calls) == 13
    assert db.did_commit is True
