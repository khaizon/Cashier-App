# Cashier backend

FastAPI + SQLite service that replaces the Google Sheets / `gapi` layer the app
used to talk to. It owns:

- **accounts** — username + password login over the OAuth2 password flow, issuing
  a signed JWT. Passwords are stored salted and hashed (see below).
- **catalog** — the categories and items that used to be read from the spreadsheet.
- **sales** — the order records that used to be appended back to the spreadsheet.

## Quick start

```bash
cd backend
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt

# create the schema, an admin user and a sample catalog
.venv/bin/python seed.py --username admin --password 'devpassword123'

# run it
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs>

From the repo root you can also use `npm run backend` and `npm run backend:test`.

## Seeding

```
.venv/bin/python seed.py --username admin              # random password, printed once
.venv/bin/python seed.py --username admin --password secret
.venv/bin/python seed.py --reset                       # drop tables, then reseed
.venv/bin/python seed.py --no-sample-catalog           # schema + user only
```

The sample catalog is placeholder data so the UI has something to sell. Replace
`SAMPLE_CATALOG` in `seed.py`, or insert your own rows.

## API

| Method | Path              | Auth | Purpose                                  |
| ------ | ----------------- | ---- | ---------------------------------------- |
| GET    | `/api/health`     | –    | Liveness probe                           |
| POST   | `/api/auth/token` | –    | Form-encoded `username`/`password` → JWT |
| GET    | `/api/auth/me`    | JWT  | The current user                         |
| GET    | `/api/catalog`    | JWT  | Categories with their items              |
| POST   | `/api/sales`      | JWT  | Record a sale                            |
| GET    | `/api/sales`      | JWT  | Recent sales, newest first               |
| GET    | `/api/images/{id}`| –    | An image's bytes (see below)             |
| POST   | `/api/images`     | JWT  | Upload an image, cropped to a square     |
| GET    | `/api/admin/catalog` | JWT | Full catalog for editing              |
| POST   | `/api/admin/categories` | JWT | Create a category                  |
| PATCH  | `/api/admin/categories/{id}` | JWT | Rename / recolour a category  |
| DELETE | `/api/admin/categories/{id}` | JWT | Delete a category and its items |
| POST   | `/api/admin/items` | JWT | Create an item                          |
| PATCH  | `/api/admin/items/{id}` | JWT | Update an item                     |
| DELETE | `/api/admin/items/{id}` | JWT | Delete an item                      |
| DELETE | `/api/admin/images/{id}` | JWT | Delete an unreferenced image      |

Send the token as `Authorization: Bearer <token>`.

```bash
TOKEN=$(curl -s -X POST localhost:8000/api/auth/token \
  -d 'username=admin&password=devpassword123' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -s localhost:8000/api/catalog -H "Authorization: Bearer $TOKEN"

curl -s -X POST localhost:8000/api/sales -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"payment":"cash","items":[{"item_id":1,"quantity":2}]}'

# Crop a square out of a 640x360 photo and attach it to item 1.
IMAGE=$(curl -s -X POST localhost:8000/api/images -H "Authorization: Bearer $TOKEN" \
  -F file=@photo.jpg -F crop_left=0.25 -F crop_top=0 -F crop_right=0.75 -F crop_bottom=1 \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s -X PATCH localhost:8000/api/admin/items/1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"image_id\": $IMAGE}"
```

## Images

Uploaded images are stored **in the database**, not on disk, so a catalogue is a
single portable artifact and the service needs no writable volume.

**Cropping.** The app renders item tiles in a square frame, so the server
normalises every upload to a square. The client sends the chosen region as four
normalised coordinates (`crop_left`/`crop_top`/`crop_right`/`crop_bottom`, each
0..1 of the *oriented* image, and either all four or none). Normalised
coordinates are resolution-independent, so the browser can preview on a
downscaled canvas while the crop is applied to the full-resolution original.

The server never trusts the client to have sent a square: it re-derives a square
centred on the requested rectangle, clamps it inside the image, and rejects a
crop smaller than 5% of the shorter edge. Omitting the crop takes the largest
centred square. EXIF orientation is applied *before* the geometry, so a portrait
phone photo is cropped the way the user saw it.

**Storage.** `process_upload` re-encodes to WebP (quality 88), capped at 1024px
and never upscaled — re-encoding also strips EXIF and any trailing payload, so a
malformed file cannot smuggle arbitrary bytes into the database. Identical output
is deduplicated on the SHA-256 of the encoded bytes, so re-uploading the same
picture is free.

**Delivery.** `GET /api/images/{public_id}` is deliberately unauthenticated:
these bytes are rendered by an `<img src>`, which cannot carry an
`Authorization` header. Each row instead gets a random `public_id`, so the
sequential primary key is never exposed and the image space cannot be enumerated.
Images are immutable — changing an item's picture stores a *new* row and repoints
the item, bumping `items.image_version` so a cached URL is bypassed. That is what
makes `Cache-Control: immutable` safe, and it keeps historical references valid.

Deleting an item leaves its image in place (sale history may still reference it);
`DELETE /api/admin/images/{id}` removes one explicitly and refuses while any item
still uses it.

**Migrations.** `create_all` creates missing tables but never alters existing
ones, so `app/migrations.py` applies additive changes (new columns and indexes)
on startup. It is idempotent and runs after `create_all`. Introspection there
uses `PRAGMA table_info` on the migration's own connection — `inspect()` caches
per-table reflection, and checking out a second connection can roll back the
migration's uncommitted work under a shared-connection pool.

## Design notes

**Passwords.** Each password is hashed with PBKDF2-HMAC-SHA256 (260,000
iterations, 16-byte random salt, 32-byte key) from the standard library, and
stored in `users.password_hash` as a single self-describing string:

```
pbkdf2_sha256$260000$<base64url salt>$<base64url digest>
```

The salt lives inside that string, so the users table needs one column for a
salted hash and the parameters needed to verify it. Verification uses
`hmac.compare_digest`. Login for an unknown username still performs a dummy hash
so response time does not reveal which usernames exist.

**Money.** Prices and totals are stored as **integer cents**
(`items.price_cents`, `sales.total_cents`) so totals never accumulate binary
floating-point error. The API converts to dollars at the edge.

**Sale lines are snapshots.** `sale_items` copies `title` and `price_cents` at
sale time, so editing or deleting a catalog item later does not rewrite history.
`item_id` is kept as a soft reference and nulled if the item is removed.

**Prices come from the server.** `POST /api/sales` accepts only item ids and
quantities; it looks up prices itself, so a client cannot choose what it pays.
Repeated ids are merged into a single line.

## Configuration

Copy `.env.example` to `.env`. Every setting is prefixed `CASHIER_`:

| Variable                             | Default                    |
| ------------------------------------ | -------------------------- |
| `CASHIER_SECRET_KEY`                 | insecure dev key (warns)   |
| `CASHIER_DATABASE_URL`               | `sqlite:///./data/cashier.db` |
| `CASHIER_ACCESS_TOKEN_EXPIRE_MINUTES`| `720`                      |
| `CASHIER_CORS_ORIGINS`               | localhost:5173 / :4173     |

**Set `CASHIER_SECRET_KEY` before deploying anywhere but localhost** — the
default is public. Tokens are signed with HS256; keys shorter than 32 bytes log
a warning. Rotating the key invalidates all existing tokens.

## Tests

```bash
.venv/bin/python -m pytest        # or: npm run backend:test
```

Tests run against a throwaway SQLite file per test, with `get_db` and
`get_settings` overridden, so they never touch `data/cashier.db`.

## Not included (deliberately)

This is an MVP. Before real use you would also want: HTTPS, refresh tokens or
shorter token lifetimes, a user-management endpoint (today users are created by
`seed.py`), rate limiting on login, and role separation — every authenticated
user can currently edit the catalog, so the CMS is not access-controlled beyond
"has a login".

The additive migrations in `app/migrations.py` are a stopgap, not a substitute
for Alembic: they only cover new columns and indexes.
