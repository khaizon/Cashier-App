"""Shared pytest fixtures.

Each test gets its own throwaway SQLite file and a ``TestClient`` whose ``get_db``
and ``get_settings`` dependencies are overridden, so tests never touch
``backend/data/cashier.db``.

``TestClient`` is deliberately not used as a context manager: that is what runs
the FastAPI lifespan, which would create tables on the real configured engine.
``Base.metadata.create_all`` is called explicitly on the test engine instead.
"""

from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings, get_settings
from app.database import Base, create_db_engine, get_db
from app.main import create_app
from app.models import Category, Item, User
from app.security import hash_password

TEST_SECRET_KEY = "test-secret-key-not-for-production"
TEST_USERNAME = "cashier"
TEST_PASSWORD = "correct-horse-battery-staple"


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        secret_key=TEST_SECRET_KEY,
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        access_token_expire_minutes=30,
        cors_origins="http://localhost:5173",
    )


@pytest.fixture
def session_factory(settings: Settings) -> Generator[sessionmaker[Session], None, None]:
    engine = create_db_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def db_session(session_factory: sessionmaker[Session]) -> Generator[Session, None, None]:
    with session_factory() as session:
        yield session


@pytest.fixture
def client(settings: Settings, session_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_settings] = lambda: settings

    yield TestClient(app)


@pytest.fixture
def user(db_session: Session) -> User:
    account = User(username=TEST_USERNAME, password_hash=hash_password(TEST_PASSWORD))
    db_session.add(account)
    db_session.commit()
    return account


@pytest.fixture
def auth_headers(client: TestClient, user: User) -> dict[str, str]:
    response = client.post(
        "/api/auth/token",
        data={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def catalog(db_session: Session) -> dict[str, int]:
    """Two categories / three items, returning the ids tests need."""
    coffee = Category(name="Coffee", palette1="#111111", palette2="#222222", palette3="#333333", sort_order=0)
    coffee.items = [
        Item(title="Espresso", price_cents=300, img="espresso.png", sort_order=0),
        Item(title="Flat White", price_cents=500, img="flat-white.png", sort_order=1),
    ]
    tea = Category(name="Tea", palette1="#444444", palette2="#555555", palette3="#666666", sort_order=1)
    tea.items = [Item(title="Green Tea", price_cents=350, img="green-tea.png", sort_order=0)]

    db_session.add_all([coffee, tea])
    db_session.commit()

    return {
        "espresso_id": coffee.items[0].id,
        "flat_white_id": coffee.items[1].id,
        "green_tea_id": tea.items[0].id,
    }
