"""Additive schema migrations for the SQLite deployments.

``Base.metadata.create_all`` creates *missing tables* but never alters an
existing one. This project has no Alembic, and the deployment is a single SQLite
file, so adding a column to an existing database needs an explicit step —
without it, an upgraded checkout would crash on the first query against its old
``items`` table.

Scope is deliberately narrow: additive changes only (new columns, new indexes),
which is the entire class of change this app has needed. Anything destructive or
type-changing should get a real migration tool instead of being bolted on here.

Every step is idempotent, so this is safe to run on each startup and on a
database created fresh by ``create_all``.

Two implementation constraints, both learned the hard way:

* Introspection uses ``PRAGMA table_info`` / ``PRAGMA index_list`` rather than
  SQLAlchemy's ``inspect()``. The Inspector caches per-table reflections, so a
  column added mid-migration was invisible to a later check, silently skipping
  steps.
* All introspection runs on the *migration's own* connection. Checking out a
  second connection to run a PRAGMA can share the same pooled DBAPI connection
  (certainly under ``StaticPool``), and closing it rolls back the outer
  transaction — discarding uncommitted DML while the already-committed DDL
  remains. That produced columns that existed with no backfilled values.
"""

from __future__ import annotations

import logging

from sqlalchemy import Connection, Engine, text

logger = logging.getLogger("cashier.migrations")


def _table_exists(conn: Connection, table: str) -> bool:
    row = conn.exec_driver_sql(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", (table,)
    ).first()
    return row is not None


def _column_names(conn: Connection, table: str) -> set[str]:
    """Live column list, read on the caller's connection."""
    if not _table_exists(conn, table):
        return set()
    rows = conn.exec_driver_sql(f'PRAGMA table_info("{table}")').fetchall()
    return {row[1] for row in rows}


def _has_index(conn: Connection, table: str, index: str) -> bool:
    if not _table_exists(conn, table):
        return False
    # PRAGMA index_list rows are (seq, name, unique, origin, partial).
    rows = conn.exec_driver_sql(f'PRAGMA index_list("{table}")').fetchall()
    return any(row[1] == index for row in rows)


def migration_001_catalogue_images(engine: Engine) -> None:
    """Introduce CMS-managed images: ``item_images.public_id`` + item pointers."""
    with engine.begin() as conn:
        image_columns = _column_names(conn, "item_images")
        if image_columns and "public_id" not in image_columns:
            conn.execute(text("ALTER TABLE item_images ADD COLUMN public_id VARCHAR(32)"))
            logger.info("migration 001: added item_images.public_id")
            # Backfill anything uploaded before public URLs existed, so the
            # unique index below can be created.
            conn.execute(
                text("UPDATE item_images SET public_id = lower(hex(randomblob(16))) WHERE public_id IS NULL")
            )

        item_columns = _column_names(conn, "items")
        if item_columns and "image_id" not in item_columns:
            conn.execute(
                text("ALTER TABLE items ADD COLUMN image_id INTEGER REFERENCES item_images(id) ON DELETE SET NULL")
            )
            logger.info("migration 001: added items.image_id")
        if item_columns and "image_version" not in item_columns:
            conn.execute(text("ALTER TABLE items ADD COLUMN image_version INTEGER NOT NULL DEFAULT 0"))
            conn.execute(text("UPDATE items SET image_version = 0 WHERE image_version IS NULL"))
            logger.info("migration 001: added items.image_version")

        # Created here rather than by the ORM so it exists on upgraded databases
        # too; on a fresh database the ORM already made it and this is skipped.
        index_name = "ix_item_images_public_id"
        if "public_id" in _column_names(conn, "item_images") and not _has_index(conn, "item_images", index_name):
            conn.execute(text(f"CREATE UNIQUE INDEX IF NOT EXISTS {index_name} ON item_images (public_id)"))
            logger.info("migration 001: created %s", index_name)


def migration_002_offline_sync(engine: Engine) -> None:
    """Add the columns an offline till needs to reconcile safely.

    ``client_ref`` is added nullable, backfilled, then indexed: adding a NOT NULL
    unique column to a table that already has rows cannot work in place.
    """
    with engine.begin() as conn:
        sale_columns = _column_names(conn, "sales")
        if not sale_columns:
            return

        if "client_ref" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN client_ref VARCHAR(36)"))
            logger.info("migration 002: added sales.client_ref")

        if "sold_at" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN sold_at DATETIME"))
            logger.info("migration 002: added sales.sold_at")

        if "recorded_at" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN recorded_at DATETIME"))
            # Existing rows were recorded when they were created.
            conn.execute(text("UPDATE sales SET recorded_at = created_at WHERE recorded_at IS NULL"))
            logger.info("migration 002: added sales.recorded_at")

        if "price_conflict" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN price_conflict BOOLEAN NOT NULL DEFAULT 0"))
            logger.info("migration 002: added sales.price_conflict")

        # Backfill any row that predates the idempotency key, then enforce
        # uniqueness. hex(randomblob(16)) is 32 chars of hex — unique in practice
        # and valid for a client_ref.
        pending = conn.execute(text("SELECT COUNT(*) FROM sales WHERE client_ref IS NULL")).scalar() or 0
        if pending:
            conn.execute(
                text("UPDATE sales SET client_ref = lower(hex(randomblob(16))) WHERE client_ref IS NULL")
            )
            logger.info("migration 002: backfilled %d client_ref value(s)", pending)

        if not _has_index(conn, "sales", "ix_sales_client_ref"):
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_sales_client_ref ON sales (client_ref)"))
            logger.info("migration 002: created ix_sales_client_ref")

        if not _has_index(conn, "sales", "ix_sales_price_conflict"):
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sales_price_conflict ON sales (price_conflict)"))
            logger.info("migration 002: created ix_sales_price_conflict")

        if not _table_exists(conn, "catalog_meta"):
            conn.execute(
                text(
                    "CREATE TABLE catalog_meta ("
                    " id INTEGER NOT NULL PRIMARY KEY,"
                    " revision INTEGER NOT NULL DEFAULT 1,"
                    " updated_at DATETIME)"
                )
            )
            conn.execute(text("INSERT INTO catalog_meta (id, revision) VALUES (1, 1)"))
            logger.info("migration 002: created catalog_meta")


def migration_003_sale_deletions(engine: Engine) -> None:
    """Add the audit table for deleted sales.

    ``create_all`` would make this on a fresh database; an upgraded one needs it
    created here so a delete can be recorded rather than silently lost.
    """
    with engine.begin() as conn:
        if _table_exists(conn, "sale_deletions"):
            return
        conn.execute(
            text(
                "CREATE TABLE sale_deletions ("
                " id INTEGER NOT NULL PRIMARY KEY,"
                " sale_id INTEGER NOT NULL,"
                " order_ref VARCHAR(16) NOT NULL,"
                " total_cents INTEGER NOT NULL,"
                " payment VARCHAR(16) DEFAULT '',"
                " sold_at DATETIME,"
                " client_ref VARCHAR(36),"
                " items_json TEXT DEFAULT '[]',"
                " reason VARCHAR(255) DEFAULT '',"
                " deleted_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,"
                " deleted_at DATETIME)"
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sale_deletions_sale_id ON sale_deletions (sale_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sale_deletions_order_ref ON sale_deletions (order_ref)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sale_deletions_deleted_at ON sale_deletions (deleted_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sale_deletions_client_ref ON sale_deletions (client_ref)"))
        logger.info("migration 003: created sale_deletions")


MIGRATIONS = (migration_001_catalogue_images, migration_002_offline_sync, migration_003_sale_deletions)


def run_migrations(engine: Engine) -> None:
    for migration in MIGRATIONS:
        migration(engine)
