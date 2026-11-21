"""Waste2Wealth API entry point.

Run locally (from the backend/ folder):
    uvicorn app.main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, listings, profiles
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.integrations.supabase.client import close_shared_http


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    close_shared_http()


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=logging.INFO)

    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-Response-Time"],
    )
    register_exception_handlers(app)

    timing_log = logging.getLogger("app.timing")

    @app.middleware("http")
    async def add_response_time(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time"] = f"{ms:.0f}ms"
        if request.method != "OPTIONS":
            timing_log.info("%s %s -> %s in %.0f ms", request.method, request.url.path, response.status_code, ms)
        return response

    app.include_router(health.router)  # /health (no prefix, for load balancers)
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(profiles.router, prefix=settings.api_prefix)
    app.include_router(listings.router, prefix=settings.api_prefix)
    return app


app = create_app()
