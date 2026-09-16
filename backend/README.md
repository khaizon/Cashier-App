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

Send the token as `Authorization: Bearer <token>`.

```bash
TOKEN=$(curl -s -X POST localhost:8000/api/auth/token \
  -d 'username=admin&password=devpassword123' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

curl -s localhost:8000/api/catalog -H "Authorization: Bearer $TOKEN"

curl -s -X POST localhost:8000/api/sales -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"payment":"cash","items":[{"item_id":1,"quantity":2}]}'
```

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
`seed.py`), rate limiting on login, and a real migration tool (Alembic) instead
of `create_all`.
