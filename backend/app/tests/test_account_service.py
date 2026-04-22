from types import SimpleNamespace

from app.services.account_service import AccountService


class FakeSession:
    def __init__(self) -> None:
        self.calls: list[object] = []
        self.did_commit = False

    def execute(self, statement) -> None:
        self.calls.append(statement)

    def commit(self) -> None:
        self.did_commit = True


def test_delete_user_account_executes_full_cleanup() -> None:
    db = FakeSession()
    service = AccountService(db)  # type: ignore[arg-type]
    service.delete_user_account(SimpleNamespace(id="usr_123"))

    assert len(db.calls) == 8
    assert db.did_commit is True
