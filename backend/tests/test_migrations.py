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


# --------------------------------------------------- migration 002 (offline sync)

# The pre-offline-sync shape of ``sales``: an existing deployment upgrading to
# the version that introduced client-side queuing.
LEGACY_SALES_DDL = """
    CREATE TABLE sales (
        id INTEGER NOT NULL PRIMARY KEY,
        order_ref VARCHAR(16) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        payment VARCHAR(16),
        total_cents INTEGER,
        created_at DATETIME
    )
"""


@pytest.fixture
def legacy_sales_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as conn:
        conn.execute(text(LEGACY_SALES_DDL))
        conn.execute(text("CREATE TABLE items (id INTEGER NOT NULL PRIMARY KEY, title VARCHAR(160))"))
    yield engine
    engine.dispose()


def test_offline_columns_are_added_to_sales(legacy_sales_engine):
    assert "client_ref" not in columns(legacy_sales_engine, "sales")

    run_migrations(legacy_sales_engine)

    sale_columns = columns(legacy_sales_engine, "sales")
    assert {"client_ref", "sold_at", "recorded_at", "price_conflict"} <= sale_columns


def test_existing_sales_get_a_backfilled_client_ref(legacy_sales_engine):
    """Pre-existing rows need a key before the unique index can be created."""
    with legacy_sales_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO sales (id, order_ref, user_id, payment, total_cents, created_at) "
                "VALUES (1, 'ABC123', 1, 'cash', 300, '2026-01-01 10:00:00')"
            )
        )

    run_migrations(legacy_sales_engine)

    with legacy_sales_engine.connect() as conn:
        client_ref = conn.exec_driver_sql("SELECT client_ref FROM sales WHERE id = 1").scalar()
        recorded_at = conn.exec_driver_sql("SELECT recorded_at FROM sales WHERE id = 1").scalar()
    assert client_ref
    # recorded_at is backfilled from created_at rather than left null.
    assert recorded_at is not None


def test_backfilled_client_refs_are_unique(legacy_sales_engine):
    with legacy_sales_engine.begin() as conn:
        for index in range(1, 6):
            conn.execute(
                text(
                    "INSERT INTO sales (id, order_ref, user_id, payment, total_cents, created_at) "
                    f"VALUES ({index}, 'REF{index:03d}', 1, 'cash', 100, '2026-01-01 10:00:00')"
                )
            )

    run_migrations(legacy_sales_engine)

    with legacy_sales_engine.connect() as conn:
        distinct = conn.exec_driver_sql("SELECT COUNT(DISTINCT client_ref) FROM sales").scalar()
    assert distinct == 5


def test_client_ref_index_is_unique(legacy_sales_engine):
    run_migrations(legacy_sales_engine)

    with legacy_sales_engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO sales (id, order_ref, user_id, payment, total_cents, created_at, client_ref) "
                "VALUES (1, 'AAA111', 1, 'cash', 100, '2026-01-01 10:00:00', 'shared-ref')"
            )
        )

    with pytest.raises(IntegrityError):
        with legacy_sales_engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO sales (id, order_ref, user_id, payment, total_cents, created_at, client_ref) "
                    "VALUES (2, 'BBB222', 1, 'cash', 100, '2026-01-01 10:00:00', 'shared-ref')"
                )
            )


def test_catalog_meta_is_created_and_seeded(legacy_sales_engine):
    run_migrations(legacy_sales_engine)

    with legacy_sales_engine.connect() as conn:
        revision = conn.exec_driver_sql("SELECT revision FROM catalog_meta WHERE id = 1").scalar()
    assert revision == 1


def test_offline_migration_is_idempotent(legacy_sales_engine):
    run_migrations(legacy_sales_engine)
    run_migrations(legacy_sales_engine)

    assert "client_ref" in columns(legacy_sales_engine, "sales")
    with legacy_sales_engine.connect() as conn:
        assert conn.exec_driver_sql("SELECT COUNT(*) FROM catalog_meta").scalar() == 1
