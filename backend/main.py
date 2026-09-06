import asyncio
import random
import uuid
import time
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="SatQuery AI Mock Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (mock)
sessions: dict = {}

SENSOR_NAMES = [
    "Sentinel-2A (ESA)", "WorldView-3 (Maxar)", "RISAT-1 (ISRO)",
    "Cartosat-2S (ISRO)", "Landsat-9 (USGS)", "SPOT-7 (Airbus)",
    "PlanetScope (Planet)", "TerraSAR-X (DLR)", "Sentinel-1B (ESA)"
]

CRS_LIST = [
    "EPSG:4326 (WGS84)", "EPSG:32643 (UTM Zone 43N)", "EPSG:32644 (UTM Zone 44N)",
    "EPSG:3857 (Web Mercator)", "EPSG:32618 (UTM Zone 18N)"
]

ANSWER_TEMPLATES = {
    "single-image-vqa": [
        "The image shows a dense urban area with approximately {r1}% built-up surface coverage. Vegetation indices suggest moderate greenery concentrated in the {dir} quadrant. Road network density is {rd} intersections/km².",
        "Analysis reveals a mixed land-use pattern: {r1}% residential, {r2}% commercial, {r3}% green space. The {dir} portion shows higher impervious surface density consistent with industrial zoning.",
        "The scene contains {obj} distinct structural clusters. The largest contiguous urban fabric spans approximately {r1} km². Water body in the {dir} occupies roughly {r2}% of total scene area.",
        "Radiometric analysis indicates surface reflectance consistent with post-monsoon vegetation recovery. NDVI values range 0.{r1} to 0.{r2} across vegetated patches, with built-up zones showing values below 0.1.",
    ],
    "change-vqa": [
        "Comparing the two acquisitions ({days}-day interval), the flooded extent increased by approximately {r1} km². The {dir} residential zone shows the greatest inundation depth based on radar return decrease.",
        "Significant land-cover change detected: {r1} ha of formerly vegetated area transitioned to bare soil or water. Change probability map shows {r2}% of the AOI with high-confidence change (>0.85 threshold).",
        "Urban expansion is evident between epochs: approximately {r1} new rooftop structures detected in the peri-urban fringe. Forest cover decreased by {r2}% in the {dir} segment.",
        "Post-event assessment identifies {r1} affected parcels with coherence loss in SAR comparison, indicating structural damage probability of {r2}% in the marked clusters.",
    ],
    "fusion": [
        "SAR-optical fusion analysis: the cross-modal correlation identifies {r1} candidate objects with coherent backscatter and optical spectral signatures. Most consistent with {cls} infrastructure at {conf}% joint confidence.",
        "Multi-sensor fusion reveals subsidence pattern in the {dir} sector: optical texture discontinuity aligns with SAR interferometric phase anomaly, indicating {r1}±{r2} mm/year displacement rate.",
        "The optical image resolves spectral anomalies at {r1} locations; SAR backscatter confirms {r2} of these as high-density structures. Remaining {r3} are likely vegetation clumps misclassified in optical-only analysis.",
    ],
    "grounding": [
        "Localized {r1} instances of the queried object class. Highest confidence detection ({conf}%) at the marked bounding box in the {dir} quadrant. The structure spans approximately {sz}×{sz2} meters.",
        "Object grounding complete: {r1} candidate regions match the described morphology. Primary detection in {dir} shows {conf}% class probability; secondary cluster in the opposite quadrant shows {conf2}%.",
    ],
}

CLASSES = ["built-up", "vegetation", "water body", "bare soil", "industrial", "agricultural", "road network", "airport"]
DIRECTIONS = ["northern", "southern", "eastern", "western", "central", "northeastern", "southwestern"]

def make_answer(task: str) -> str:
    r1 = random.randint(20, 85)
    r2 = random.randint(5, 40)
    r3 = max(0, 100 - r1 - r2)
    days = random.choice([14, 30, 45, 60, 90, 180])
    template = random.choice(ANSWER_TEMPLATES.get(task, ANSWER_TEMPLATES["single-image-vqa"]))
    return template.format(
        r1=r1, r2=r2, r3=r3, days=days,
        dir=random.choice(DIRECTIONS),
        obj=random.randint(3, 12),
        rd=round(random.uniform(4.5, 18.2), 1),
        cls=random.choice(CLASSES),
        conf=random.randint(78, 97),
        conf2=random.randint(55, 77),
        sz=random.randint(30, 120),
        sz2=random.randint(20, 100),
    )

def make_bboxes(count: int = None) -> list:
    n = count or random.randint(1, 4)
    boxes = []
    for _ in range(n):
        x = random.randint(5, 65)
        y = random.randint(5, 65)
        w = random.randint(8, 25)
        h = random.randint(6, 20)
        label = random.choice(CLASSES)
        conf = random.randint(72, 98)
        boxes.append({"x": x, "y": y, "w": w, "h": h, "label": label, "confidence": conf})
    return boxes

def make_execution_trace(task: str) -> list:
    retrieval_exemplars = random.randint(2, 5)
    knowledge_docs = random.randint(1, 4)
    model_name = random.choice(["RemoteCLIP-ViT-L/14", "GeoRSCLIP-B/32", "SkySense-Fusion", "SkyScript-VQA-7B"])
    verify_method = random.choice([
        "NDWI delta agrees with flood claim",
        "SAR coherence loss corroborates change",
        "Spectral unmixing validates vegetation fraction",
        "Temporal NDVI trajectory is self-consistent",
        "Cross-modal backscatter confirms building presence",
    ])
    return [
        {"step": "task_classification", "detail": f"Classified as '{task}' with {random.randint(88, 99)}% router confidence"},
        {"step": "visual_rag_retrieval", "detail": f"{retrieval_exemplars} scene exemplars retrieved (cosine sim > 0.{random.randint(72,89)})"},
        {"step": "textual_rag_retrieval", "detail": f"{knowledge_docs} geospatial knowledge documents retrieved from corpus"},
        {"step": "model_inference", "detail": f"{model_name} invoked; token budget {random.randint(256, 1024)}"},
        {"step": "deterministic_verification", "detail": verify_method},
    ]


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": time.time(), "service": "SatQuery AI Mock Backend"}


@app.post("/api/upload")
async def upload(
    mode: str = Form(...),
    image1: UploadFile = File(...),
    image2: Optional[UploadFile] = File(None),
):
    session_id = str(uuid.uuid4())
    lat = round(random.uniform(12.0, 48.0), 6)
    lon = round(random.uniform(68.0, 97.0), 6)
    gsd = round(random.uniform(0.3, 10.0), 2)
    sessions[session_id] = {
        "mode": mode,
        "filenames": [image1.filename] + ([image2.filename] if image2 else []),
        "lat": lat, "lon": lon, "gsd": gsd,
    }
    return {
        "session_id": session_id,
        "mode": mode,
        "metadata": {
            "sensor": random.choice(SENSOR_NAMES),
            "crs": random.choice(CRS_LIST),
            "resolution_m": gsd,
            "scene_center": {"lat": lat, "lon": lon},
            "acquisition_date": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            "cloud_cover_pct": round(random.uniform(0, 15), 1),
            "num_bands": random.choice([3, 4, 6, 8, 12]),
            "size_px": [random.choice([512, 1024, 2048, 4096])] * 2,
        }
    }


class QueryRequest(BaseModel):
    session_id: str
    query: str


@app.post("/api/query")
async def query(req: QueryRequest):
    delay = random.uniform(0.8, 1.5)
    await asyncio.sleep(delay)

    q_lower = req.query.lower()

    # Heuristic task classification based on keywords
    if any(k in q_lower for k in ["change", "before", "after", "differ", "flood", "expand", "temporal"]):
        task = "change-vqa"
    elif any(k in q_lower for k in ["where", "locate", "find", "detect", "show me", "ground"]):
        task = "grounding"
    elif any(k in q_lower for k in ["sar", "optical", "fusion", "radar", "combine"]):
        task = "fusion"
    else:
        task = "single-image-vqa"

    confidence = random.randint(62, 97)
    answer = make_answer(task)
    trace = make_execution_trace(task)
    bboxes = make_bboxes() if task == "grounding" else (make_bboxes(random.randint(0, 2)) if random.random() > 0.5 else [])

    return {
        "answer": answer,
        "confidence": confidence,
        "task_classified": task,
        "execution_trace": trace,
        "bounding_boxes": bboxes,
        "inference_time_ms": round(delay * 1000),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
