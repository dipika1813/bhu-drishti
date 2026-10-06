import os
import io
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from main import app, load_persisted_sessions, sessions, UPLOAD_DIR, SESSIONS_INDEX_FILE

client = TestClient(app)

def test_full_upload_persistence_lifecycle():
    # 1. Create and upload a valid test raster
    img = Image.new("RGB", (100, 100), color=(50, 150, 250))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    files = {
        "image1": ("satellite_test_zone.png", png_bytes, "image/png"),
    }
    data = {"mode": "single"}

    upload_res = client.post("/api/upload", data=data, files=files)
    assert upload_res.status_code == 200
    res_data = upload_res.json()

    session_id = res_data["session_id"]
    file_path = res_data["file_paths"][0]
    file1_url = res_data["file1_url"]

    # Verify file saved on disk
    assert os.path.exists(file_path)
    assert SESSIONS_INDEX_FILE.exists()

    # 2. Query against uploaded session
    q_res = client.post("/api/query", json={"session_id": session_id, "query": "Analyze water and urban zones"})
    assert q_res.status_code == 200
    assert q_res.json()["confidence"] > 50

    # 3. Verify static file serving
    static_res = client.get(file1_url)
    assert static_res.status_code == 200
    assert len(static_res.content) == len(png_bytes)

    # 4. Simulate application restart:
    # Clear in-memory sessions dictionary and reload from disk
    sessions.clear()
    assert len(sessions) == 0

    reloaded = load_persisted_sessions()
    assert session_id in reloaded
    sessions.update(reloaded)

    # 5. Verify session retrieval, sample list, and query work seamlessly after restart
    sess_res = client.get(f"/api/session/{session_id}")
    assert sess_res.status_code == 200
    assert sess_res.json()["session_id"] == session_id

    samples_res = client.get("/api/samples")
    assert samples_res.status_code == 200
    sample_ids = [s.get("session_id") for s in samples_res.json()["samples"]]
    assert session_id in sample_ids

    # Query again on reloaded session
    q_res_post_restart = client.post("/api/query", json={"session_id": session_id, "query": "Locate vegetation buffers"})
    assert q_res_post_restart.status_code == 200
    assert len(q_res_post_restart.json()["bounding_boxes"]) > 0
