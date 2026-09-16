"""FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__, models  # noqa: F401  (import registers ORM tables on Base.metadata)
from .config import MIN_SECRET_KEY_BYTES, get_settings
from .database import Base, engine
from .routers import auth, catalog, sales

logger = logging.getLogger("cashier")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    if settings.uses_dev_secret:
        logger.warning(
            "CASHIER_SECRET_KEY is not set; falling back to the insecure development key. "
            "Set it before running anywhere but localhost."
        )
    elif settings.secret_key_is_short:
        logger.warning(
            "CASHIER_SECRET_KEY is shorter than %d bytes, which is below the minimum "
            "recommended for HS256.",
            MIN_SECRET_KEY_BYTES,
        )
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="Cashier API", version=__version__, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(catalog.router)
    app.include_router(sales.router)

    @app.get("/api/health", tags=["meta"], summary="Liveness probe")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    return app


app = create_app()
