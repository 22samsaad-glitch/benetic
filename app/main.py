from __future__ import annotations
import os
print(f"[startup] DATABASE_URL = {os.getenv('DATABASE_URL', 'NOT SET')}")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.routers import auth, leads, pipelines, webhooks, workflows, templates, tasks, team, analytics, integrations, gdpr, business

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Lead management and outbound automation API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - restrict to FRONTEND_URL in production if set
_cors_origins = (
    [settings.FRONTEND_URL]
    if settings.FRONTEND_URL
    else ["*"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(pipelines.router)
app.include_router(webhooks.router)
app.include_router(workflows.router)
app.include_router(templates.router)
app.include_router(tasks.router)
app.include_router(team.router)
app.include_router(analytics.router)
app.include_router(integrations.router)
app.include_router(gdpr.router)
app.include_router(business.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
