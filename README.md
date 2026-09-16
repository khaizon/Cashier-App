# Cashier App

A point-of-sale web app for a small cafe: sign in, tap items to build a cart,
compute change, and record the sale.

- **Frontend** — React 19 + TypeScript + Vite 8, installable as a PWA. Built
  output is committed to `docs/` and served by GitHub Pages.
- **Backend** — FastAPI + SQLite (`backend/`), which replaced an earlier
  Google Sheets / `gapi` integration.

## Layout

```
src/            React app
  api/          REST client + session helpers (replaces the old gapi calls)
  components/   UI, grouped by role (auth, selecting, displaying, modals)
backend/        FastAPI service — see backend/README.md
e2e/            Playwright tests — see e2e/README.md
docs/           build output (GitHub Pages)
```

## Running it

Two processes: the API on `:8000` and the UI on `:5173`.

```bash
# 1. backend — first run only: create a venv, install, seed
cd backend
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python seed.py --username admin --password 'devpassword123'
cd ..

# 2. run both
npm run backend     # http://localhost:8000  (docs at /docs)
npm run dev         # http://localhost:5173/Cashier-App/
```

Sign in with the username and password you seeded. If you omit `--password`,
`seed.py` generates one and prints it once.

Point the UI at a different API host with `VITE_API_BASE_URL`
(see `.env.example`).

## Tests

```bash
npm run backend:test    # pytest, 28 tests, throwaway SQLite per test
npm run lint            # eslint
npm run build           # tsc + vite build -> docs/

# browser end-to-end (needs `npm run build` first, and ports 8000/4173 free)
cd e2e && ../backend/.venv/bin/python -m pytest
```

## Notes

- Prices are stored as integer cents in SQLite and converted to dollars at the
  API edge, so totals stay exact.
- The session JWT is kept in `localStorage` and its `exp` is checked on load.
  That is convenient but readable by any script on the page — if you later add
  third-party scripts, move to an httpOnly cookie.
- `docs/` is build output. Run `npm run build` rather than editing it.
