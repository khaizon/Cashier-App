"""Tests for the salted password hashing and JWT helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.security import (
    ALGORITHM,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

SECRET = "unit-test-secret-key-long-enough-for-hs256"
OTHER_SECRET = "a-different-secret-key-also-long-enough"
PASSWORD = "hunter2"


def test_hash_is_self_describing_and_salted():
    stored = hash_password(PASSWORD)
    algorithm, iterations, salt, digest = stored.split("$")

    assert algorithm == ALGORITHM
    assert int(iterations) >= 100_000
    assert salt and digest
    assert PASSWORD not in stored


def test_same_password_hashes_differently_each_time():
    first, second = hash_password(PASSWORD), hash_password(PASSWORD)

    assert first != second, "a random salt must make identical passwords hash differently"
    assert verify_password(PASSWORD, first)
    assert verify_password(PASSWORD, second)


def test_verify_password_accepts_correct_and_rejects_wrong():
    stored = hash_password(PASSWORD)

    assert verify_password(PASSWORD, stored)
    assert not verify_password("hunter3", stored)
    assert not verify_password("", stored)


def test_verify_password_rejects_malformed_hash():
    for malformed in ["", "not-a-hash", "pbkdf2_sha256$abc$x$y", "md5$1000$c2FsdA$aGFzaA", "a$b$c"]:
        assert not verify_password(PASSWORD, malformed)


def test_unknown_algorithm_is_rejected():
    _, iterations, salt, digest = hash_password(PASSWORD).split("$")
    assert not verify_password(PASSWORD, f"scrypt${iterations}${salt}${digest}")


def test_access_token_round_trip():
    token = create_access_token("alice", secret_key=SECRET, algorithm="HS256", expires_minutes=5)
    claims = decode_access_token(token, secret_key=SECRET, algorithm="HS256")

    assert claims is not None
    assert claims["sub"] == "alice"
    assert claims["exp"] > claims["iat"]


def test_access_token_rejects_wrong_secret_and_garbage():
    token = create_access_token("alice", secret_key=SECRET, algorithm="HS256", expires_minutes=5)

    assert decode_access_token(token, secret_key=OTHER_SECRET, algorithm="HS256") is None
    assert decode_access_token("not.a.jwt", secret_key=SECRET, algorithm="HS256") is None


def test_expired_token_is_rejected():
    expired = create_access_token(
        "alice",
        secret_key=SECRET,
        algorithm="HS256",
        expires_minutes=5,
        now=datetime.now(timezone.utc) - timedelta(hours=1),
    )

    assert decode_access_token(expired, secret_key=SECRET, algorithm="HS256") is None
