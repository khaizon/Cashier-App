"""Login / token / current-user endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User
from app.security import hash_password
from tests.conftest import TEST_PASSWORD, TEST_USERNAME


def test_login_returns_bearer_token(client: TestClient, user: User):
    response = client.post("/api/auth/token", data={"username": TEST_USERNAME, "password": TEST_PASSWORD})

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_rejects_wrong_password(client: TestClient, user: User):
    response = client.post("/api/auth/token", data={"username": TEST_USERNAME, "password": "wrong"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_login_rejects_unknown_user(client: TestClient, user: User):
    response = client.post("/api/auth/token", data={"username": "nobody", "password": TEST_PASSWORD})

    assert response.status_code == 401


def test_login_rejects_inactive_user(client: TestClient, db_session: Session):
    db_session.add(User(username="retired", password_hash=hash_password("pw"), is_active=False))
    db_session.commit()

    response = client.post("/api/auth/token", data={"username": "retired", "password": "pw"})

    assert response.status_code == 403


def test_login_requires_form_encoded_body(client: TestClient, user: User):
    response = client.post("/api/auth/token", json={"username": TEST_USERNAME, "password": TEST_PASSWORD})

    assert response.status_code == 422


def test_me_returns_current_user(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["username"] == TEST_USERNAME
    assert "password_hash" not in response.json()


def test_protected_endpoints_require_a_token(client: TestClient):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/catalog").status_code == 401
    assert client.get("/api/sales").status_code == 401
    assert client.post("/api/sales", json={"items": [{"item_id": 1, "quantity": 1}]}).status_code == 401


def test_garbage_token_is_rejected(client: TestClient):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_health_is_public(client: TestClient):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
