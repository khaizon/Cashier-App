"""Create the SQLite schema, an initial user, and a sample catalog.

Run from the ``backend/`` directory::

    .venv/bin/python seed.py --username admin
    .venv/bin/python seed.py --username admin --password 'my-secret'
    .venv/bin/python seed.py --reset          # drop everything first

If ``--password`` is omitted a random one is generated and printed once.
"""

from __future__ import annotations

import argparse
import secrets

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Category, Item, User
from app.security import hash_password

ITEM_IMAGE = "/maomao.png"

# Stand-in catalog so the app has something to sell. Replace it with the real
# menu (or an importer for the old spreadsheet) when you go live.
SAMPLE_CATALOG: list[dict] = [
    {
        "name": "Coffee",
        "palette1": "#6F4E37",
        "palette2": "#F3E7DC",
        "palette3": "#4A3428",
        "items": [("Espresso", 3.00), ("Long Black", 4.00), ("Flat White", 5.00), ("Latte", 5.50), ("Cold Brew", 6.00)],
    },
    {
        "name": "Tea",
        "palette1": "#3F7D58",
        "palette2": "#E4F0E6",
        "palette3": "#2C553D",
        "items": [("Green Tea", 3.50), ("Jasmine Tea", 3.80), ("Earl Grey", 4.00), ("Peach Oolong", 4.80)],
    },
    {
        "name": "Pastries",
        "palette1": "#C98A3C",
        "palette2": "#FBEEDA",
        "palette3": "#8A5A21",
        "items": [("Butter Croissant", 4.20), ("Almond Croissant", 5.20), ("Cinnamon Roll", 5.00), ("Banana Bread", 4.50)],
    },
    {
        "name": "Merch",
        "palette1": "#B0457A",
        "palette2": "#FBE3EF",
        "palette3": "#7A2F54",
        "items": [("Ceramic Mug", 14.00), ("Tote Bag", 18.00), ("Sticker Pack", 5.00)],
    },
]


def seed_sample_catalog(session) -> int:
    """Insert the sample catalog. Does nothing if categories already exist."""
    if session.scalar(select(Category.id).limit(1)) is not None:
        return 0

    created = 0
    for category_order, entry in enumerate(SAMPLE_CATALOG):
        category = Category(
            name=entry["name"],
            palette1=entry["palette1"],
            palette2=entry["palette2"],
            palette3=entry["palette3"],
            sort_order=category_order,
        )
        for item_order, (title, price) in enumerate(entry["items"]):
            category.items.append(
                Item(
                    title=title,
                    price_cents=round(price * 100),
                    img=ITEM_IMAGE,
                    sort_order=item_order,
                )
            )
        session.add(category)
        created += 1

    return created


def create_user(session, username: str, password: str, *, force: bool = False) -> bool:
    """Create ``username``. Returns False if it already existed and was left alone."""
    existing = session.scalar(select(User).where(User.username == username))
    if existing is not None:
        if not force:
            return False
        existing.password_hash = hash_password(password)
        return True

    session.add(User(username=username, password_hash=hash_password(password)))
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialise the cashier database.")
    parser.add_argument("--username", default="admin", help="username to create (default: admin)")
    parser.add_argument("--password", help="password to set; a random one is generated when omitted")
    parser.add_argument("--reset", action="store_true", help="drop all tables before seeding")
    parser.add_argument("--no-sample-catalog", action="store_true", help="skip the sample catalog")
    args = parser.parse_args()

    password = args.password or secrets.token_urlsafe(12)

    if args.reset:
        Base.metadata.drop_all(bind=engine)
        print("dropped existing tables")

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        is_new_user = create_user(session, args.username, password, force=args.reset or bool(args.password))
        category_count = 0 if args.no_sample_catalog else seed_sample_catalog(session)
        session.commit()

    print(f"database ready: {engine.url}")
    if is_new_user:
        print(f"  user    : {args.username} (password set)")
    else:
        print(f"  user    : {args.username} already existed, left unchanged")
    if category_count:
        print(f"  catalog : seeded {category_count} categories")

    if args.password is None:
        print()
        print(f"  generated password for '{args.username}': {password}")
        print("  ^ shown once; store it now or re-run with --password")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
