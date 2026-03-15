"""
auth.py — JWT Authentication Middleware
----------------------------------------
Provides a FastAPI dependency `get_current_user` that validates the JWT token
issued by the Tryora Express backend and returns the decoded user payload.

The same JWT_SECRET and JWT_ALGORITHM used by the Express backend must be set
in the environment (see .env.example).
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from app.config.settings import settings
from app.config.logging import logger

_bearer = HTTPBearer(auto_error=False)


class TokenPayload:
    """Decoded JWT payload fields used across the application."""

    def __init__(self, user_id: str, email: str, role: str = "user") -> None:
        self.user_id = user_id
        self.email = email
        self.role = role


def _decode_token(token: str) -> TokenPayload:
    """Decode and validate a JWT, returning a TokenPayload."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.warning("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub") or payload.get("userId") or payload.get("id")
    email: str = payload.get("email", "")
    role: str = payload.get("role", "user")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenPayload(user_id=user_id, email=email, role=role)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
) -> TokenPayload:
    """FastAPI dependency — validates JWT and returns current user payload."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _decode_token(credentials.credentials)


async def get_current_admin(
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
) -> TokenPayload:
    """FastAPI dependency — requires admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
