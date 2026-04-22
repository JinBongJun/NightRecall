from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user, get_db
from app.api.v1.rate_limit import rate_limit_ip, rate_limit_user
from app.db.models.user import User
from app.db.schemas.auth import (
    AuthSessionResponse,
    GoogleSignInRequest,
    GuestSessionRequest,
    LinkGoogleRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenPair,
)
from app.db.schemas.me import MeResponse
from app.db.schemas.users import UserResponse
from app.services.account_service import AccountService
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()


@router.post("/guest/session", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
def create_guest_session(
    payload: GuestSessionRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ip(endpoint="users.guest_session", limit=10, window_seconds=60)),
) -> AuthSessionResponse:
    response = AuthService(db).create_guest_session(payload)
    AnalyticsService(db).record(
        name="auth.session.created",
        user_id=response.user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"provider": "guest", "is_new_user": response.is_new_user},
    )
    return response


@router.post("/google/session", response_model=AuthSessionResponse, status_code=status.HTTP_200_OK)
def sign_in_with_google(
    payload: GoogleSignInRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ip(endpoint="users.google_session", limit=10, window_seconds=60)),
) -> AuthSessionResponse:
    response = AuthService(db).sign_in_with_google(payload.id_token, payload.timezone, payload.locale, payload.device_label)
    AnalyticsService(db).record(
        name="auth.session.created",
        user_id=response.user.id,
        request_id=getattr(request.state, "request_id", None),
        props={"provider": "google", "is_new_user": response.is_new_user},
    )
    return response


@router.post("/refresh", response_model=TokenPair, status_code=status.HTTP_200_OK)
def refresh_session(
    payload: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_user(endpoint="users.refresh", limit=30, window_seconds=60)),
) -> TokenPair:
    tokens = AuthService(db).refresh_session(payload)
    # Note: we do not attach user_id here (refresh token may be invalid and we don't want to decode it again).
    AnalyticsService(db).record(
        name="auth.refresh",
        user_id=None,
        request_id=getattr(request.state, "request_id", None),
        props=None,
    )
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> None:
    AuthService(db).logout(payload.refresh_token)


@router.post("/link/google", response_model=AuthSessionResponse, status_code=status.HTTP_200_OK)
def link_google_account(
    payload: LinkGoogleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    return AuthService(db).link_google_identity(current_user, payload)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(user=UserResponse.model_validate(current_user))


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    AccountService(db).delete_user_account(current_user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    service = UserService(db)
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
