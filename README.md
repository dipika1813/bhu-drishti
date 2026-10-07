# SatQuery AI — How to Run

## Quick Start

### 1. Backend (FastAPI mock server)

```powershell
cd backend
pip install -r requirements.txt
python main.py
# Server starts at http://localhost:8000
```

### 2. Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

---

## Demo Workflow

1. **Landing Screen** — choose a mode, drag-drop an image (or click "LOAD SAMPLE"), hit **INITIALIZE SESSION**
2. **Console** — the image fills the viewport with HUD overlays
3. **Query** — type a question in the bottom command bar (e.g. *"What is the dominant land use?"*) and press **RUN**
4. **Results** — the right panel slides in with the AI answer, confidence bar, and execution trace
5. **Sensor Toggles** — click [1]–[5] along the bottom to switch color filters (NDVI, SAR, etc.)
6. **Click-to-Inspect** — click anywhere on the image to drop a reticle with mock pixel values

## Backend Offline Mode

The frontend automatically falls back to **client-side mock data** if the backend is unreachable — so the demo works even without Python running.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload images, get session ID + metadata |
| POST | `/api/query` | Submit NL query, returns mocked analysis result |

## Sample Images (bundled in `/public`)

| File | Description |
|------|-------------|
| `sample_optical.jpg` | True-color urban optical (use for Single / Cross-Modal) |
| `sample_sar.jpg` | SAR grayscale radar image |
| `sample_before.jpg` | Coastal scene before flooding |
| `sample_after.jpg` | Same area after flooding (use for Bi-Temporal) |

