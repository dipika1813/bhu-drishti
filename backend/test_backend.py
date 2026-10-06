import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "BhuDrishti" in data["service"]
    assert data["demo_mode"] is True

def test_samples_endpoint():
    res = client.get("/api/samples")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 3
    assert len(data["samples"]) >= 3
    assert any(s["mode"] == "single" for s in data["samples"])
    assert any(s["mode"] == "bitemporal" for s in data["samples"])

def test_upload_single_mode():
    files = {
        "image1": ("test_optical.jpg", b"\xff\xd8\xff\xe0testimagebytes", "image/jpeg"),
    }
    data = {"mode": "single"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 200
    body = res.json()
    assert "session_id" in body
    assert body["mode"] == "single"
    assert "metadata" in body
    assert body["metadata"]["sensor"] is not None

def test_upload_invalid_mode():
    files = {
        "image1": ("test_optical.jpg", b"imagebytes", "image/jpeg"),
    }
    data = {"mode": "invalid_mode"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 400

def test_upload_missing_secondary_in_bitemporal():
    files = {
        "image1": ("test_optical.jpg", b"imagebytes", "image/jpeg"),
    }
    data = {"mode": "bitemporal"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 400

def test_query_flow_construction():
    # First upload
    files = {
        "image1": ("city.jpg", b"imagebytes", "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    session_id = up_res.json()["session_id"]

    # Query for construction
    q_res = client.post("/api/query", json={"session_id": session_id, "query": "Identify new construction and buildings"})
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert q_data["confidence"] > 70
    assert len(q_data["findings"]) > 0
    assert len(q_data["bounding_boxes"]) > 0
    assert any("building" in b["label"].lower() or "built-up" in b["label"].lower() or "commercial" in b["label"].lower() for b in q_data["bounding_boxes"])
    assert len(q_data["execution_trace"]) >= 5

def test_query_flow_water():
    files = {
        "image1": ("flood_before.jpg", b"imagebytes", "image/jpeg"),
        "image2": ("flood_after.jpg", b"imagebytes", "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "bitemporal"}, files=files)
    session_id = up_res.json()["session_id"]

    q_res = client.post("/api/query", json={"session_id": session_id, "query": "Where is the flood water inundation?"})
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert any("water" in b["label"].lower() or "inundat" in b["label"].lower() for b in q_data["bounding_boxes"])
    assert any("Hydrology" in f["category"] or "Inundation" in f["category"] for f in q_data["findings"])

def test_query_empty_string():
    res = client.post("/api/query", json={"session_id": "fake", "query": "   "})
    assert res.status_code == 422 or res.status_code == 400

def test_session_retrieval():
    files = {
        "image1": ("optical.jpg", b"imagebytes", "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    session_id = up_res.json()["session_id"]

    get_res = client.get(f"/api/session/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == session_id

def test_session_not_found():
    res = client.get("/api/session/non-existent-session-id")
    assert res.status_code == 404
