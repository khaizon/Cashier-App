# End-to-end tests

Playwright drives a real Chromium against the **built** frontend and a real
FastAPI process, so this exercises the whole stack: browser → REST API → SQLite.

## Running

Both servers are started automatically by `conftest.py` against a throwaway
database, but two things must be true first:

```bash
npm run build                 # docs/ must be current — preview serves it
export PATH=<node-26>/bin:$PATH   # npm must be on PATH
```

Then, from this directory:

```bash
../backend/.venv/bin/python -m pip install -r requirements.txt
../backend/.venv/bin/python -m playwright install chromium

../backend/.venv/bin/python -m pytest
```

Any Python environment with `pytest` and `playwright` works; reusing the backend
venv is just the fewest moving parts.

Ports **8000** (backend) and **4173** (frontend) must be free; the suite skips
itself if they are not. The backend port is fixed because the frontend bakes in
`VITE_API_BASE_URL` at build time.

The suite creates its own user (`e2e` / `e2e-password`) and seeds the sample
catalog into a temporary SQLite file, so `backend/data/cashier.db` is untouched.
