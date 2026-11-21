"""Waste2Wealth API entry point.

Run locally (from the backend/ folder):
    uvicorn app.main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
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
    )
    register_exception_handlers(app)

    app.include_router(health.router)  # /health (no prefix, for load balancers)
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(profiles.router, prefix=settings.api_prefix)
    app.include_router(listings.router, prefix=settings.api_prefix)
    return app


app = create_app()
