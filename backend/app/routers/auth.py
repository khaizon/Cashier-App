"""OAuth2 password-flow login."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from ..deps import AppSettings, CurrentUser, DbSession
from ..models import User
from ..schemas import Token, UserOut
from ..security import create_access_token, verify_password, verify_password_dummy

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/token", response_model=Token, summary="Exchange username and password for a bearer token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
    settings: AppSettings,
) -> Token:
    user = db.scalar(select(User).where(User.username == form_data.username))

    if user is None:
        # Do the same work as a real check so response time does not reveal
        # whether the username exists.
        verify_password_dummy(form_data.password)
        raise _invalid_credentials()

    if not verify_password(form_data.password, user.password_hash):
        raise _invalid_credentials()

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    access_token = create_access_token(
        user.username,
        secret_key=settings.secret_key,
        algorithm=settings.jwt_algorithm,
        expires_minutes=settings.access_token_expire_minutes,
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut, summary="The currently authenticated user")
def read_me(user: CurrentUser) -> User:
    return user
