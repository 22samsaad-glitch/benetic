"""
Test fixtures. Uses a separate test database via SQLite in-memory for speed.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.dependencies import get_db, hash_password
from app.main import app
from app.models.pipeline import Pipeline, PipelineStage
from app.models.tenant import Tenant, User

# In-memory SQLite for tests — we need to handle UUID and JSON compatibility
TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    # Render UUID as strings in SQLite
    echo=False,
)

# Enable SQLite foreign keys
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def tenant(db) -> Tenant:
    t = Tenant(name="Test Business", slug="test-biz", webhook_key="test-key-123")
    db.add(t)
    db.flush()

    # Default pipeline
    pipeline = Pipeline(tenant_id=t.id, name="Sales", is_default=True)
    db.add(pipeline)
    db.flush()
    for i, (name, terminal) in enumerate([("New", False), ("Contacted", False), ("Won", True), ("Lost", True)]):
        db.add(PipelineStage(pipeline_id=pipeline.id, tenant_id=t.id, name=name, position=i, is_terminal=terminal))

    db.commit()
    db.refresh(t)
    return t


@pytest.fixture
def owner(db, tenant) -> User:
    u = User(
        tenant_id=tenant.id,
        email="owner@test.com",
        password_hash=hash_password("password123"),
        name="Test Owner",
        role="owner",
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def auth_headers(client, owner, tenant) -> dict:
    """Get auth headers by logging in."""
    resp = client.post("/api/v1/auth/login", json={"email": "owner@test.com", "password": "password123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
