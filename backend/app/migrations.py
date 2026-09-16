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


MIGRATIONS = (migration_001_catalogue_images,)


def run_migrations(engine: Engine) -> None:
    for migration in MIGRATIONS:
        migration(engine)
