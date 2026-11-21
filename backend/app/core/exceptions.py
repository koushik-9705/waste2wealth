"""Application errors and the handlers that turn them into the standard error envelope.

Error response shape (docs/API_Design.md 2.3):
    {"success": false, "message": "...", "error": {"code": "FORBIDDEN"}}
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: object | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", message)


class ForbiddenError(AppError):
    def __init__(self, message: str = "The requested operation is not allowed"):
        super().__init__(status.HTTP_403_FORBIDDEN, "FORBIDDEN", message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, "NOT_FOUND", message)


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(status.HTTP_409_CONFLICT, "CONFLICT", message)


# Postgres SQLSTATE -> HTTP. Includes the codes raised by transition_request().
_PG_ERROR_MAP: dict[str, tuple[int, str]] = {
    "28000": (401, "UNAUTHORIZED"),
    "42501": (403, "FORBIDDEN"),  # RLS violation / insufficient privilege
    "P0002": (404, "NOT_FOUND"),
    "22023": (409, "CONFLICT"),  # invalid state transition
    "23505": (409, "CONFLICT"),  # unique violation
    "23503": (409, "CONFLICT"),  # foreign key violation
    "23514": (422, "VALIDATION_ERROR"),  # check constraint
    "22P02": (422, "VALIDATION_ERROR"),  # invalid input syntax (e.g. bad uuid)
    "P0001": (400, "BAD_REQUEST"),  # RAISE EXCEPTION from triggers
}


def _error_body(code: str, message: str, details: object | None = None) -> dict:
    error: dict = {"code": code}
    if details is not None:
        error["details"] = details
    return {"success": False, "message": message, "error": error}


def map_postgrest_error(exc: APIError) -> AppError:
    status_code, code = _PG_ERROR_MAP.get(exc.code or "", (500, "INTERNAL_ERROR"))
    message = exc.message if status_code < 500 else "Unexpected database error"
    return AppError(status_code, code, message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_error_body(exc.code, exc.message, exc.details))

    @app.exception_handler(APIError)
    async def _postgrest_error(_: Request, exc: APIError) -> JSONResponse:
        mapped = map_postgrest_error(exc)
        if mapped.status_code >= 500:
            logger.error("Database error %s: %s", exc.code, exc.message)
        return JSONResponse(status_code=mapped.status_code, content=_error_body(mapped.code, mapped.message))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            {"field": ".".join(str(p) for p in err["loc"][1:]), "message": err["msg"]}
            for err in exc.errors()
        ]
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content=_error_body("VALIDATION_ERROR", "Request validation failed", details))

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_error_body("HTTP_ERROR", str(exc.detail)))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error")
        return JSONResponse(status_code=500, content=_error_body("INTERNAL_ERROR", "Unexpected server error"))
