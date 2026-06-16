from fastapi.testclient import TestClient

from ado_service.app import app


def test_api_session_update():
    client = TestClient(app)

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"ok": True}

    created = client.post("/ado/sessions", json={})
    assert created.status_code == 200
    body = created.json()

    session_id = body["session_id"]
    design = body["next_design"]

    updated = client.post(
        f"/ado/sessions/{session_id}/update",
        json={
            "design": design,
            "response": {"choice": 1},
        },
    )

    assert updated.status_code == 200
    assert updated.json()["trial_index"] == 1

