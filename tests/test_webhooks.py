from __future__ import annotations
def test_universal_ingest(client, tenant):
    resp = client.post(
        f"/api/v1/webhooks/ingest/{tenant.slug}",
        json={
            "email": "webhook@test.com",
            "first_name": "Webhook",
            "last_name": "Lead",
            "source": "website",
            "utm_source": "google",
            "utm_campaign": "spring-sale",
        },
        headers={"X-API-Key": tenant.webhook_key},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["is_duplicate"] is False
    assert data["lead_id"] is not None


def test_ingest_deduplication(client, tenant):
    headers = {"X-API-Key": tenant.webhook_key}
    payload = {"email": "dupe@test.com", "first_name": "First"}

    r1 = client.post(f"/api/v1/webhooks/ingest/{tenant.slug}", json=payload, headers=headers)
    r2 = client.post(f"/api/v1/webhooks/ingest/{tenant.slug}", json=payload, headers=headers)

    assert r1.json()["is_duplicate"] is False
    assert r2.json()["is_duplicate"] is True


def test_ingest_name_splitting(client, tenant):
    resp = client.post(
        f"/api/v1/webhooks/ingest/{tenant.slug}",
        json={"email": "name@test.com", "name": "Jane Smith"},
        headers={"X-API-Key": tenant.webhook_key},
    )
    assert resp.status_code == 200


def test_ingest_bad_api_key(client, tenant):
    resp = client.post(
        f"/api/v1/webhooks/ingest/{tenant.slug}",
        json={"email": "test@test.com"},
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 401


def test_ingest_missing_contact(client, tenant):
    resp = client.post(
        f"/api/v1/webhooks/ingest/{tenant.slug}",
        json={"first_name": "No Contact"},
        headers={"X-API-Key": tenant.webhook_key},
    )
    assert resp.status_code == 400


def test_ingest_unknown_tenant(client):
    resp = client.post(
        "/api/v1/webhooks/ingest/nonexistent",
        json={"email": "test@test.com"},
        headers={"X-API-Key": "any"},
    )
    assert resp.status_code == 404
