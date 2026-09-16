"""The additive migration must bring a pre-CMS database up to date.

The starting schema is written out as raw DDL on purpose: SQLAlchemy models now
describe the *target* shape, so building the old shape from them is impossible.
This mirrors the real ``backend/data/cashier.db`` that predates the CMS.
"""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool

from app.migrations import run_migrations

LEGACY_DDL = (
    """
    CREATE TABLE item_images (
        id INTEGER NOT NULL PRIMARY KEY,
        data BLOB NOT NULL,
        content_type VARCHAR(64),
        filename VARCHAR(255),
        width INTEGER,
        height INTEGER,
        byte_size INTEGER,
        sha256 VARCHAR(64),
        created_at DATETIME
    )
    """,
    """
    CREATE TABLE items (
        id INTEGER NOT NULL PRIMARY KEY,
        category_id INTEGER NOT NULL,
        title VARCHAR(160),
        price_cents INTEGER,
        img VARCHAR(500),
        sort_order INTEGER
    )
    """,
)


@pytest.fixture
def legacy_engine():
    # StaticPool keeps every connection on the same in-memory database.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as conn:
        for statement in LEGACY_DDL:
            conn.execute(text(statement))
    yield engine
    engine.dispose()


def columns(engine, table: str) -> set[str]:
    return {column["name"] for column in inspect(engine).get_columns(table)}


def test_migration_adds_the_image_columns(legacy_engine):
    assert "image_id" not in columns(legacy_engine, "items")

    run_migrations(legacy_engine)

    item_columns = columns(legacy_engine, "items")
    assert {"image_id", "image_version"} <= item_columns
    assert "public_id" in columns(legacy_engine, "item_images")


def test_migration_preserves_existing_rows(legacy_engine):
    with legacy_engine.begin() as conn:
        conn.execute(text("INSERT INTO items (id, category_id, title, price_cents, img, sort_order) VALUES (1, 1, 'Espresso', 300, 'espresso.png', 0)"))

    run_migrations(legacy_engine)

    with legacy_engine.begin() as conn:
        row = conn.execute(text("SELECT title, price_cents, img, image_version, image_id FROM items WHERE id = 1")).one()
    assert row == ("Espresso", 300, "espresso.png", 0, None)


def test_migration_backfills_public_ids_for_pre_existing_images(legacy_engine):
    with legacy_engine.begin() as conn:
        conn.execute(text("INSERT INTO item_images (id, data, width, height, byte_size, sha256) VALUES (7, X'00', 10, 10, 1, 'abc')"))

    run_migrations(legacy_engine)

    with legacy_engine.begin() as conn:
        public_id = conn.execute(text("SELECT public_id FROM item_images WHERE id = 7")).scalar_one()
    assert public_id


def test_backfilled_public_ids_are_unique(legacy_engine):
    with legacy_engine.begin() as conn:
        for image_id in (1, 2, 3):
            conn.execute(
                text(
                    "INSERT INTO item_images (id, data, width, height, byte_size, sha256) "
                    "VALUES (:id, X'00', 10, 10, 1, 'x')"
                ),
                {"id": image_id},
            )

    run_migrations(legacy_engine)

    with legacy_engine.begin() as conn:
        distinct = conn.execute(text("SELECT COUNT(DISTINCT public_id) FROM item_images")).scalar_one()
    assert distinct == 3


def test_migration_is_idempotent(legacy_engine):
    run_migrations(legacy_engine)
    run_migrations(legacy_engine)  # must not raise on already-migrated schema

    assert "public_id" in columns(legacy_engine, "item_images")


def test_migration_creates_a_unique_index_on_public_id(legacy_engine):
    run_migrations(legacy_engine)

    # Check the index exists first, so the assertion below cannot be satisfied
    # by some other constraint firing.
    with legacy_engine.connect() as conn:
        indexes = {row[1] for row in conn.exec_driver_sql('PRAGMA index_list("item_images")').fetchall()}
    assert "ix_item_images_public_id" in indexes

    with legacy_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO item_images (id, public_id, data, width, height, byte_size, sha256) "
                "VALUES (901, 'duplicate-id', X'00', 1, 1, 1, 'h')"
            )
        )

    # A separate transaction: the setup insert is committed, so a failure here
    # can only be the new row being rejected.
    with pytest.raises(IntegrityError):
        with legacy_engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO item_images (id, public_id, data, width, height, byte_size, sha256) "
                    "VALUES (902, 'duplicate-id', X'00', 1, 1, 1, 'h2')"
                )
            )
