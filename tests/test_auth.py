from __future__ import annotations
def test_register(client):
    resp = client.post("/api/v1/auth/register", json={
        "business_name": "Acme Inc",
        "slug": "acme",
        "owner_name": "Jane",
        "owner_email": "jane@acme.com",
        "password": "securepass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_slug(client):
    payload = {
        "business_name": "Acme Inc",
        "slug": "acme",
        "owner_name": "Jane",
        "owner_email": "jane@acme.com",
        "password": "securepass123",
    }
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_login(client, owner):
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, owner):
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@test.com",
        "password": "wrong",
    })
    assert resp.status_code == 401


def test_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "owner@test.com"


def test_refresh(client, owner):
    login = client.post("/api/v1/auth/login", json={"email": "owner@test.com", "password": "password123"})
    refresh_token = login.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
