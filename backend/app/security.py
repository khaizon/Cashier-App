"""Password hashing and JWT access tokens.

Passwords are stored as a single self-describing string::

    pbkdf2_sha256$<iterations>$<base64url salt>$<base64url digest>

The per-user random salt is embedded in that string, so the ``users`` table needs
only one column for a salted hash and the parameters used to verify it.
PBKDF2-HMAC-SHA256 comes from the standard library, so there is no native build
dependency (bcrypt/argon2) to install.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 260_000
SALT_BYTES = 16
KEY_BYTES = 32

# Verified against when the username does not exist, so that a login attempt for
# an unknown user costs the same as one for a known user (no username oracle).
_DUMMY_HASH = f"{ALGORITHM}${ITERATIONS}${base64.urlsafe_b64encode(b'0' * SALT_BYTES).decode().rstrip('=')}${base64.urlsafe_b64encode(b'0' * KEY_BYTES).decode().rstrip('=')}"


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    """Hash ``password`` with a fresh random salt."""
    if not password:
        raise ValueError("password must not be empty")
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS, dklen=KEY_BYTES)
    return f"{ALGORITHM}${ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Constant-time check of ``password`` against a stored hash."""
    try:
        algorithm, iterations, salt_b64, digest_b64 = stored_hash.split("$")
        if algorithm != ALGORITHM:
            return False
        salt = _b64decode(salt_b64)
        expected = _b64decode(digest_b64)
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations), dklen=len(expected))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate, expected)


def verify_password_dummy(password: str) -> bool:
    """Burn the same work as a real verification, always returning False."""
    verify_password(password, _DUMMY_HASH)
    return False


def create_access_token(
    subject: str,
    *,
    secret_key: str,
    algorithm: str,
    expires_minutes: int,
    now: datetime | None = None,
) -> str:
    issued_at = now or datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": issued_at,
        "exp": issued_at + timedelta(minutes=expires_minutes),
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_access_token(token: str, *, secret_key: str, algorithm: str) -> dict | None:
    """Return the token claims, or ``None`` if the token is invalid or expired."""
    try:
        return jwt.decode(token, secret_key, algorithms=[algorithm])
    except jwt.PyJWTError:
        return None
