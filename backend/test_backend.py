import os
import io
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
from fastapi.testclient import TestClient
from main import (
    app,
    normalize_bounding_boxes,
    resolve_session_images,
    load_persisted_sessions,
    sessions,
    UPLOAD_DIR,
)

client = TestClient(app)

def create_dummy_jpeg() -> bytes:
    img = Image.new("RGB", (64, 64), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "BhuDrishti" in data["service"]
    assert "ai_model" in data

def test_samples_endpoint():
    res = client.get("/api/samples")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 3
    assert len(data["samples"]) >= 3
    assert any(s["mode"] == "single" for s in data["samples"])
    assert any(s["mode"] == "bitemporal" for s in data["samples"])

def test_upload_single_mode_persists_file():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("test_optical.jpg", img_bytes, "image/jpeg"),
    }
    data = {"mode": "single"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 200
    body = res.json()
    assert "session_id" in body
    assert body["mode"] == "single"
    assert "file_paths" in body
    assert "file1_url" in body
    assert len(body["file_paths"]) == 1
    assert os.path.exists(body["file_paths"][0])

def test_upload_corrupted_image_rejected():
    files = {
        "image1": ("corrupt.jpg", b"NOT_A_VALID_IMAGE_BYTES_12345", "image/jpeg"),
    }
    data = {"mode": "single"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 400
    assert "corrupted" in res.json()["detail"].lower() or "not a valid" in res.json()["detail"].lower()

def test_upload_invalid_mode():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("test_optical.jpg", img_bytes, "image/jpeg"),
    }
    data = {"mode": "invalid_mode"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 400

def test_upload_missing_secondary_in_bitemporal():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("test_optical.jpg", img_bytes, "image/jpeg"),
    }
    data = {"mode": "bitemporal"}
    res = client.post("/api/upload", data=data, files=files)
    assert res.status_code == 400

def test_session_persistence_across_restarts():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("persistence_test.jpg", img_bytes, "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    assert up_res.status_code == 200
    session_id = up_res.json()["session_id"]

    # Simulate server restart by reloading sessions from disk
    reloaded_sessions = load_persisted_sessions()
    assert session_id in reloaded_sessions
    assert reloaded_sessions[session_id]["session_id"] == session_id
    assert os.path.exists(reloaded_sessions[session_id]["file_paths"][0])

def test_normalize_bounding_boxes():
    # 0-1000 scale
    boxes_1000 = [{"id": "b1", "x": 100, "y": 200, "w": 300, "h": 400, "label": "roof", "confidence": 90}]
    norm_1000 = normalize_bounding_boxes(boxes_1000)
    assert norm_1000[0]["x"] == 10.0
    assert norm_1000[0]["y"] == 20.0
    assert norm_1000[0]["w"] == 30.0
    assert norm_1000[0]["h"] == 40.0

    # 0-1 scale
    boxes_1 = [{"id": "b2", "x": 0.15, "y": 0.25, "w": 0.35, "h": 0.45, "label": "tree", "confidence": 85}]
    norm_1 = normalize_bounding_boxes(boxes_1)
    assert norm_1[0]["x"] == 15.0
    assert norm_1[0]["y"] == 25.0
    assert norm_1[0]["w"] == 35.0
    assert norm_1[0]["h"] == 45.0

def test_resolve_session_images():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("resolve_test.jpg", img_bytes, "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    session_id = up_res.json()["session_id"]
    sess = sessions.get(session_id)
    images = resolve_session_images(sess)
    assert len(images) == 1
    assert isinstance(images[0], Image.Image)

def test_query_flow_construction():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("city.jpg", img_bytes, "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    session_id = up_res.json()["session_id"]

    q_res = client.post("/api/query", json={"session_id": session_id, "query": "Identify new construction and buildings"})
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert q_data["confidence"] > 70
    assert len(q_data["findings"]) > 0
    assert len(q_data["bounding_boxes"]) > 0
    assert any("building" in b["label"].lower() or "built-up" in b["label"].lower() or "commercial" in b["label"].lower() for b in q_data["bounding_boxes"])
    assert len(q_data["execution_trace"]) >= 5

def test_query_flow_water():
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("flood_before.jpg", img_bytes, "image/jpeg"),
        "image2": ("flood_after.jpg", img_bytes, "image/jpeg"),
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
    img_bytes = create_dummy_jpeg()
    files = {
        "image1": ("optical.jpg", img_bytes, "image/jpeg"),
    }
    up_res = client.post("/api/upload", data={"mode": "single"}, files=files)
    session_id = up_res.json()["session_id"]

    get_res = client.get(f"/api/session/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == session_id

def test_list_sessions_endpoint():
    res = client.get("/api/sessions")
    assert res.status_code == 200
    data = res.json()
    assert "sessions" in data
    assert "count" in data

def test_session_not_found():
    res = client.get("/api/session/non-existent-session-id")
    assert res.status_code == 404
