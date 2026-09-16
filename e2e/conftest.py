"""E2E harness: boots the real backend and the built frontend, then drives a browser.

Requires Node 26 on PATH (for ``npm run preview``) and a built ``docs/``
directory (``npm run build``). The backend port defaults to 8000 because the
frontend bakes in ``VITE_API_BASE_URL`` at build time — if you move it with
``E2E_BACKEND_PORT``, rebuild with a matching ``VITE_API_BASE_URL`` or the
browser will keep calling the default.
"""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import time
from collections.abc import Generator
from pathlib import Path

import pytest
from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
BACKEND_PYTHON = BACKEND / ".venv" / "bin" / "python"

BACKEND_PORT = int(os.environ.get("E2E_BACKEND_PORT", "8000"))
FRONTEND_PORT = int(os.environ.get("E2E_FRONTEND_PORT", "4173"))
# Everything is pinned to IPv4: Node resolves `localhost` to ::1 first, which
# would make `vite preview` bind an IPv6-only socket that uvicorn cannot answer.
HOST = "127.0.0.1"

# Must match the VITE_BASE_PATH the bundle under test was built with, because
# `vite preview` serves the build at that base. The default mirrors
# vite.config.ts, which keeps GitHub Pages working unchanged.
def _base_path() -> str:
    raw = os.environ.get("E2E_BASE_PATH")
    if raw is None:
        return "/Cashier-App/"
    trimmed = raw.strip()
    if trimmed in ("", "/", "./"):
        return "/"
    return f"/{trimmed.strip('/')}/"


BASE_PATH = _base_path()
BASE_URL = f"http://{HOST}:{FRONTEND_PORT}{BASE_PATH}"
API_URL = f"http://{HOST}:{BACKEND_PORT}"

E2E_USERNAME = "e2e"
E2E_PASSWORD = "e2e-password"


def _wait_for_port(port: int, *, timeout: float = 60.0, process: subprocess.Popen | None = None) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process is not None and process.poll() is not None:
            output = process.stdout.read().decode(errors="replace") if process.stdout else ""
            raise RuntimeError(f"process exited early with code {process.returncode}:\n{output}")
        with socket.socket() as sock:
            sock.settimeout(0.5)
            if sock.connect_ex(("127.0.0.1", port)) == 0:
                return
        time.sleep(0.2)
    raise TimeoutError(f"nothing listening on port {port} after {timeout}s")


def _port_is_free(port: int) -> bool:
    with socket.socket() as sock:
        sock.settimeout(0.5)
        return sock.connect_ex(("127.0.0.1", port)) != 0


@pytest.fixture(scope="session")
def servers(tmp_path_factory: pytest.TempPathFactory) -> Generator[None, None, None]:
    for port in (BACKEND_PORT, FRONTEND_PORT):
        if not _port_is_free(port):
            pytest.skip(f"port {port} is already in use; stop it before running the E2E suite")

    if shutil.which("npm") is None:
        pytest.skip("npm not found on PATH; Node 26 is required for `npm run preview`")
    if not (ROOT / "docs" / "index.html").exists():
        pytest.skip("docs/index.html missing; run `npm run build` first")

    database = tmp_path_factory.mktemp("e2e-db") / "e2e.db"
    env = {
        **os.environ,
        "CASHIER_DATABASE_URL": f"sqlite:///{database}",
        "CASHIER_SECRET_KEY": "e2e-secret-key-that-is-long-enough-for-hs256",
        # Keep the preview in step with the base the assertions expect.
        "VITE_BASE_PATH": BASE_PATH,
    }

    # Point the app at the backend under test.
    #
    # `public/config.js` ships `apiBaseUrl: "/"` because in the cluster nginx
    # proxies /api to the backend service. `vite preview` does NOT proxy, so
    # leaving it as "/" sends every API call to the static server — GETs get the
    # SPA fallback (HTML 200) and POSTs get a 404. Writing the file here is the
    # same ConfigMap seam the container uses, and keeps the bundle untouched.
    (ROOT / "docs" / "config.js").write_text(
        "// Written by the e2e harness.\n"
        "window.__CASHIER_CONFIG__ = {\n"
        f"  basePath: {BASE_PATH!r},\n"
        f"  apiBaseUrl: {API_URL!r},\n"
        "};\n",
        encoding="utf-8",
    )

    # Seed a known user and catalog into the throwaway database.
    subprocess.run(
        [str(BACKEND_PYTHON), "seed.py", "--username", E2E_USERNAME, "--password", E2E_PASSWORD],
        cwd=BACKEND,
        env=env,
        check=True,
        capture_output=True,
    )

    backend = subprocess.Popen(
        [str(BACKEND_PYTHON), "-m", "uvicorn", "app.main:app", "--host", HOST, "--port", str(BACKEND_PORT)],
        cwd=BACKEND,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    frontend = subprocess.Popen(
        ["npm", "run", "preview", "--", "--host", HOST, "--port", str(FRONTEND_PORT)],
        cwd=ROOT,
        # `vite preview` reads the base from vite.config.ts, so it needs the same
        # VITE_BASE_PATH the bundle was built with. Without it, preview serves at
        # the default base and 302-redirects the root-mode URLs.
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    try:
        _wait_for_port(BACKEND_PORT, process=backend)
        _wait_for_port(FRONTEND_PORT, process=frontend)
        yield
    finally:
        for process in (frontend, backend):
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:  # pragma: no cover
                process.kill()


@pytest.fixture(scope="session")
def browser() -> Generator[Browser, None, None]:
    with sync_playwright() as playwright:
        instance = playwright.chromium.launch()
        yield instance
        instance.close()


@pytest.fixture
def context(browser: Browser) -> Generator[BrowserContext, None, None]:
    """A fresh browser context per test.

    Exposed as its own fixture so the offline specs can call ``set_offline`` on
    it; ``page`` below builds on the same context.
    """
    browser_context = browser.new_context()
    yield browser_context
    browser_context.close()


@pytest.fixture
def page(context: BrowserContext, servers: None) -> Generator[Page, None, None]:
    yield context.new_page()


@pytest.fixture
def console_errors(page: Page) -> list[str]:
    """Collects uncaught page errors and console errors for assertion."""
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    return errors


def login(page: Page, username: str = E2E_USERNAME, password: str = E2E_PASSWORD) -> None:
    page.goto(BASE_URL)
    page.get_by_placeholder("username").fill(username)
    page.get_by_placeholder("password").fill(password)
    page.get_by_role("button", name="weee!").click()


# Re-exported for tests.
__all__ = ["API_URL", "BASE_PATH", "BASE_URL", "E2E_PASSWORD", "E2E_USERNAME", "login"]
