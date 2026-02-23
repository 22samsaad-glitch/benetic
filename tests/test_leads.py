from __future__ import annotations
def test_create_lead(client, auth_headers):
    resp = client.post("/api/v1/leads/", json={
        "email": "lead@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "source": "manual",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "lead@example.com"
    assert data["source"] == "manual"


def test_create_lead_requires_contact(client, auth_headers):
    resp = client.post("/api/v1/leads/", json={
        "first_name": "John",
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_list_leads(client, auth_headers):
    client.post("/api/v1/leads/", json={"email": "a@test.com"}, headers=auth_headers)
    client.post("/api/v1/leads/", json={"email": "b@test.com"}, headers=auth_headers)
    resp = client.get("/api/v1/leads/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_search_leads(client, auth_headers):
    client.post("/api/v1/leads/", json={"email": "alice@test.com", "first_name": "Alice"}, headers=auth_headers)
    client.post("/api/v1/leads/", json={"email": "bob@test.com", "first_name": "Bob"}, headers=auth_headers)
    resp = client.get("/api/v1/leads/?search=alice", headers=auth_headers)
    assert resp.json()["total"] == 1


def test_update_lead(client, auth_headers):
    create = client.post("/api/v1/leads/", json={"email": "test@test.com"}, headers=auth_headers)
    lead_id = create.json()["id"]
    resp = client.put(f"/api/v1/leads/{lead_id}", json={"first_name": "Updated"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["first_name"] == "Updated"


def test_move_lead_stage(client, auth_headers, db, tenant):
    from app.models.pipeline import Pipeline, PipelineStage
    pipeline = db.query(Pipeline).filter_by(tenant_id=tenant.id, is_default=True).first()
    stages = db.query(PipelineStage).filter_by(pipeline_id=pipeline.id).order_by(PipelineStage.position).all()

    create = client.post("/api/v1/leads/", json={"email": "test@test.com"}, headers=auth_headers)
    lead_id = create.json()["id"]

    resp = client.post(f"/api/v1/leads/{lead_id}/move", json={"stage_id": str(stages[1].id)}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["stage_id"] == str(stages[1].id)


def test_lead_events(client, auth_headers):
    create = client.post("/api/v1/leads/", json={"email": "test@test.com"}, headers=auth_headers)
    lead_id = create.json()["id"]
    resp = client.get(f"/api/v1/leads/{lead_id}/events", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1  # at least the 'created' event
