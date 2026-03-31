from __future__ import annotations

import os
import uuid

from sqlalchemy import String, TypeDecorator, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

print("RAW DATABASE_URL:", os.environ.get("DATABASE_URL", "NOT FOUND"))

# Read DATABASE_URL directly from environment.
# Falls back to SQLite only for local dev — on Render/Railway DATABASE_URL
# must be set and will be a postgresql:// URL.
_db_url = os.environ.get("DATABASE_URL", "sqlite:///./jetleads.db")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

print("RESOLVED DATABASE_URL:", _db_url[:40])

_connect_args = {"check_same_thread": False} if _db_url.startswith("sqlite") else {}

engine = create_engine(_db_url, pool_pre_ping=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class GUID(TypeDecorator):
    """Platform-independent UUID type.
    Uses PostgreSQL's UUID type natively, falls back to CHAR(36) on SQLite.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(uuid.UUID(value))
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value)
        return value

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))


class Base(DeclarativeBase):
    pass
