"""Catalogue revision tracking for offline clients.

An offline till needs two things from this: a cheap way to ask "has the menu
changed since I cached it?", and a way to record which revision a queued sale was
priced against so the server can spot a stale price at reconciliation.

A single row in ``catalog_meta`` holds the counter. It is bumped by every
catalogue mutation and read by ``GET /api/catalog`` to build an ETag.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import CatalogMeta

# The row is a singleton; every helper funnels through this id.
META_ID = 1


def _meta(db: Session) -> CatalogMeta:
    """Fetch the singleton row, creating it on first use.

    Read paths call this, so it must tolerate a database where ``create_all`` has
    just made the table but nothing has written to it yet.
    """
    meta = db.get(CatalogMeta, META_ID)
    if meta is None:
        meta = CatalogMeta(id=META_ID, revision=1)
        db.add(meta)
        db.flush()
    return meta


def catalog_revision(db: Session) -> int:
    """Current revision."""
    return int(_meta(db).revision)


def bump_catalog_revision(db: Session) -> int:
    """Advance the revision after a catalogue write. Returns the new value.

    Deliberately does not commit — it rides along with the mutation's own
    transaction so the revision can never advance without the change that caused
    it, or vice versa.
    """
    meta = _meta(db)
    meta.revision = int(meta.revision) + 1
    db.flush()
    return int(meta.revision)
