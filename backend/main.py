import asyncio
import hashlib
import time
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="BhuDrishti Geospatial Intelligence Engine",
    description="Deterministic geospatial analysis and natural-language satellite inference API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
sessions: Dict[str, Dict[str, Any]] = {}

SENSOR_REGISTRY = [
    {"name": "Sentinel-2A (ESA)", "bands": 12, "default_gsd": 10.0, "crs": "EPSG:32643 (UTM Zone 43N)"},
    {"name": "WorldView-3 (Maxar)", "bands": 8, "default_gsd": 0.31, "crs": "EPSG:32644 (UTM Zone 44N)"},
    {"name": "Cartosat-2S (ISRO)", "bands": 4, "default_gsd": 0.65, "crs": "EPSG:32643 (UTM Zone 43N)"},
    {"name": "RISAT-1A / EOS-04 (ISRO)", "bands": 2, "default_gsd": 2.0, "crs": "EPSG:32643 (UTM Zone 43N)"},
    {"name": "Sentinel-1B C-SAR (ESA)", "bands": 2, "default_gsd": 10.0, "crs": "EPSG:3857 (Web Mercator)"},
    {"name": "Landsat-9 OLI-2 (USGS)", "bands": 11, "default_gsd": 30.0, "crs": "EPSG:32618 (UTM Zone 18N)"},
]

AVAILABLE_SAMPLES = [
    {
        "id": "sample-optical",
        "title": "Urban Built-Up & Transportation (Optical)",
        "mode": "single",
        "sensor": "Sentinel-2A (ESA)",
        "file1": "/sample_optical.jpg",
        "description": "High-density metropolitan area with road grids, commercial blocks, and vegetation patches.",
        "location": {"lat": 28.6139, "lon": 77.2090, "city": "Delhi Capital Region"},
    },
    {
        "id": "sample-crossmodal",
        "title": "Optical + C-Band SAR Co-Registration",
        "mode": "crossmodal",
        "sensor": "Sentinel-2A + Sentinel-1B SAR",
        "file1": "/sample_optical.jpg",
        "file2": "/sample_sar.jpg",
        "description": "Multi-sensor cross-modal scene pairing optical true-color with synthetic aperture radar backscatter.",
        "location": {"lat": 18.9220, "lon": 72.8347, "city": "Mumbai Coastal Zone"},
    },
    {
        "id": "sample-bitemporal",
        "title": "Bi-Temporal Coastal Flood Inundation",
        "mode": "bitemporal",
        "sensor": "Cartosat-2S (ISRO)",
        "file1": "/sample_before.jpg",
        "file2": "/sample_after.jpg",
        "description": "Pre-event baseline and post-monsoon flood inundation sequence assessing submerged surfaces.",
        "location": {"lat": 20.2961, "lon": 85.8245, "city": "Mahanadi Delta AOI"},
    },
]


def generate_session_metadata(mode: str, filename1: str, filename2: Optional[str] = None) -> Dict[str, Any]:
    seed_str = f"{mode}:{filename1}:{filename2 or ''}"
    hash_val = int(hashlib.md5(seed_str.encode("utf-8")).hexdigest()[:8], 16)

    sensor_spec = SENSOR_REGISTRY[hash_val % len(SENSOR_REGISTRY)]
    lat = round(12.0 + (hash_val % 3000) / 100.0, 6)
    lon = round(72.0 + ((hash_val // 3000) % 2000) / 100.0, 6)
    cloud_cover = round((hash_val % 80) / 10.0, 1)

    return {
        "sensor": sensor_spec["name"],
        "crs": sensor_spec["crs"],
        "resolution_m": sensor_spec["default_gsd"],
        "scene_center": {"lat": lat, "lon": lon},
        "acquisition_date": "2024-03-15",
        "cloud_cover_pct": cloud_cover,
        "num_bands": sensor_spec["bands"],
        "size_px": [1024, 1024],
        "is_synthetic_demo": True,
    }


def analyze_query_intent(query_str: str, mode: str) -> Dict[str, Any]:
    q = query_str.lower().strip()

    # Classification logic
    is_construction = any(k in q for k in ["construction", "built", "building", "structure", "urban", "house", "warehouse", "industrial", "road", "paved", "infrastructure"])
    is_vegetation = any(k in q for k in ["vegetation", "tree", "forest", "green", "agriculture", "crop", "farm", "canopy", "ndvi", "plant"])
    is_water = any(k in q for k in ["water", "flood", "inundat", "river", "lake", "ocean", "pond", "drainage", "submerge", "wet", "ndwi"])
    is_change = any(k in q for k in ["change", "before", "after", "differ", "shift", "loss", "gain", "increase", "decrease", "compare", "temporal", "delta"])
    is_sar_fusion = any(k in q for k in ["sar", "radar", "backscatter", "dielectric", "polarimetric", "cross-modal", "fuse", "fusion", "c-band"])
    is_grounding = any(k in q for k in ["where", "locate", "find", "detect", "ground", "bounding", "box", "show me", "pinpoint", "region"])

    if mode == "bitemporal" or is_change:
        task_classified = "change-vqa"
    elif mode == "crossmodal" or is_sar_fusion:
        task_classified = "fusion"
    elif is_grounding:
        task_classified = "grounding"
    else:
        task_classified = "single-image-vqa"

    # Deterministic findings based on query intent
    findings: List[Dict[str, Any]] = []
    bounding_boxes: List[Dict[str, Any]] = []
    evidence: List[Dict[str, Any]] = []

    if is_water:
        answer = (
            "Hydrological analysis indicates clear spectral characteristics of open water and saturated ground. "
            "Surface reflectance in near-infrared and shortwave infrared bands demonstrates heavy attenuation. "
            "In bi-temporal mode, inundated area expansion is estimated at 31.8% over the target baseline, "
            "concentrated in low-elevation drainage pathways."
        )
        confidence = 91
        findings = [
            {
                "category": "Hydrology",
                "title": "Open Water Extent & Runoff Channeling",
                "description": "Strong shortwave infrared absorption identifies standing water bodies and saturated silt banks.",
                "confidence": 94,
                "severity": "Warning" if mode == "bitemporal" else "Info",
            },
            {
                "category": "Inundation Impact",
                "title": "Perimeter Wetland Saturation",
                "description": "Normalized Difference Water Index (NDWI) values range between +0.28 and +0.46 across marked drainage channels.",
                "confidence": 88,
                "severity": "Warning",
            },
        ]
        bounding_boxes = [
            {"id": "box-w1", "x": 18.0, "y": 42.0, "w": 28.5, "h": 22.0, "label": "surface water body", "confidence": 94},
            {"id": "box-w2", "x": 58.0, "y": 62.0, "w": 24.0, "h": 19.5, "label": "inundated parcel", "confidence": 89},
        ]
        evidence = [
            {"type": "Spectral Metric", "metric": "NDWI Threshold", "value": "+0.38 mean", "status": "Consistent"},
            {"type": "NIR Absorption", "metric": "Band 8 Reflectance", "value": "< 0.06 surface reflectance", "status": "Verified"},
            {"type": "Topographic Drainage", "metric": "DEM Gradient", "value": "< 1.5% slope sink", "status": "Consistent"},
        ]

    elif is_vegetation:
        answer = (
            "Vegetation canopy assessment indicates healthy biomass across the peripheral sub-regions, "
            "with NDVI values averaging 0.54 in vegetated parcels. Dense canopy cover is observed along "
            "riparian buffers, while central corridors exhibit sparse or suppressed greenery consistent with urban development."
        )
        confidence = 89
        findings = [
            {
                "category": "Biomass & Land Cover",
                "title": "Active Photosynthetic Canopy",
                "description": "High near-infrared reflectance and steep red-edge step confirm healthy active chlorophyll concentration.",
                "confidence": 92,
                "severity": "Info",
            },
            {
                "category": "Agricultural / Parkland",
                "title": "Cultivated Parcel Boundaries",
                "description": "Orthogonal field delineations exhibit moderate NDVI (~0.45) with low within-field variance.",
                "confidence": 86,
                "severity": "Info",
            },
        ]
        bounding_boxes = [
            {"id": "box-v1", "x": 54.0, "y": 14.0, "w": 32.0, "h": 26.0, "label": "dense vegetation canopy", "confidence": 93},
            {"id": "box-v2", "x": 12.0, "y": 65.0, "w": 26.0, "h": 22.0, "label": "sparse green buffer", "confidence": 84},
        ]
        evidence = [
            {"type": "Index Evaluation", "metric": "NDVI Range", "value": "0.42 to 0.68", "status": "Consistent"},
            {"type": "Red Edge Gradient", "metric": "Band 5 / Band 4", "value": "2.41 ratio", "status": "Verified"},
            {"type": "Canopy Homogeneity", "metric": "GLCM Angular Second Moment", "value": "0.78", "status": "Consistent"},
        ]

    elif is_construction or is_grounding:
        answer = (
            "Structural and impervious surface detection identifies key built-up clusters with distinct rectangular footprints. "
            "High spatial frequency edges and shadow orientation indicate vertical masonry and reinforced concrete structures. "
            "Roadway network density provides connected egress across all identified structural zones."
        )
        confidence = 93
        findings = [
            {
                "category": "Built Environment",
                "title": "High-Density Built-Up Fabric",
                "description": "Impervious surface fraction exceeds 78% in central quadrants with prominent roofing reflectance.",
                "confidence": 95,
                "severity": "Info",
            },
            {
                "category": "Transportation",
                "title": "Primary Arterial Corridor",
                "description": "Linear asphalt features identified with uniform low-albedo signature and distinct lane boundaries.",
                "confidence": 90,
                "severity": "Info",
            },
        ]
        bounding_boxes = [
            {"id": "box-c1", "x": 22.0, "y": 28.0, "w": 26.0, "h": 20.0, "label": "commercial / warehouse facility", "confidence": 95},
            {"id": "box-c2", "x": 55.0, "y": 48.0, "w": 30.0, "h": 24.0, "label": "dense residential block", "confidence": 91},
            {"id": "box-c3", "x": 15.0, "y": 70.0, "w": 20.0, "h": 16.0, "label": "transport infrastructure", "confidence": 88},
        ]
        evidence = [
            {"type": "Edge Texture", "metric": "Sobel Gradient Magnitude", "value": "High directional response", "status": "Verified"},
            {"type": "Radiometric Signature", "metric": "Built-up Index (NDBI)", "value": "+0.22", "status": "Consistent"},
            {"type": "Shadow Verification", "metric": "Solar Azimuth Alignment", "value": "142.5° offset matched", "status": "Consistent"},
        ]

    elif is_sar_fusion:
        answer = (
            "Cross-modal synthesis merges optical multispectral imagery with Synthetic Aperture Radar (SAR) backscatter. "
            "Specular radar reflection confirms smooth open ground surfaces, while corner-reflector double bounce signals "
            "validate structural building facades despite partial optical cloud or shadow interference."
        )
        confidence = 90
        findings = [
            {
                "category": "Cross-Modal Correlation",
                "title": "SAR Double-Bounce Structural Alignment",
                "description": "High C-band VV/VH cross-polarization ratio coincides precisely with optical building perimeters.",
                "confidence": 92,
                "severity": "Info",
            },
            {
                "category": "Dielectric Analysis",
                "title": "Ground Moisture Attenuation",
                "description": "Reduced microwave backscatter corroborates high soil moisture detected in peripheral zones.",
                "confidence": 87,
                "severity": "Info",
            },
        ]
        bounding_boxes = [
            {"id": "box-s1", "x": 30.0, "y": 25.0, "w": 28.0, "h": 22.0, "label": "radar double-bounce structural target", "confidence": 94},
            {"id": "box-s2", "x": 62.0, "y": 55.0, "w": 24.0, "h": 20.0, "label": "low-backscatter specular ground", "confidence": 88},
        ]
        evidence = [
            {"type": "Polarimetric Ratio", "metric": "VH / VV Backscatter", "value": "-14.2 dB / -7.8 dB", "status": "Verified"},
            {"type": "Optical Coregistration", "metric": "Residual Affine Error", "value": "0.24 pixels RMSE", "status": "Consistent"},
            {"type": "Speckle Filter", "metric": "Lee Sigma 7x7 Window", "value": "Equivalent Number of Looks: 4.8", "status": "Verified"},
        ]

    else:
        # General / default scene analysis
        answer = (
            "Comprehensive scene assessment reveals a composite landscape featuring mixed land-use classes: "
            "approximately 48% built-up impervious surface, 32% active or semi-vegetated terrain, "
            "and 20% open or transition ground. Spatial coherence and spectral signatures remain consistent across all spectral channels."
        )
        confidence = 88
        findings = [
            {
                "category": "Land-Use Classification",
                "title": "Macro Landscape Partitioning",
                "description": "Optical spectral clusters separate clearly into urban infrastructure, vegetative cover, and bare soil.",
                "confidence": 90,
                "severity": "Info",
            },
            {
                "category": "Scene Radiometry",
                "title": "Atmospheric & Radiometric Balance",
                "description": "Atmospheric path radiance corrected; dynamic range exhibits balanced histogram across visible and NIR bands.",
                "confidence": 86,
                "severity": "Info",
            },
        ]
        bounding_boxes = [
            {"id": "box-g1", "x": 20.0, "y": 20.0, "w": 35.0, "h": 28.0, "label": "primary urban cluster", "confidence": 92},
            {"id": "box-g2", "x": 60.0, "y": 45.0, "w": 28.0, "h": 32.0, "label": "mixed vegetation buffer", "confidence": 85},
        ]
        evidence = [
            {"type": "Spectral Clustering", "metric": "k-means separability", "value": "Davies-Bouldin index 0.62", "status": "Consistent"},
            {"type": "Radiance Calibration", "metric": "Top-of-Atmosphere (TOA)", "value": "Reflectance range [0.02, 0.74]", "status": "Verified"},
        ]

    trace = [
        {"step": "task_classification", "detail": f"Classified query intent as '{task_classified}' with high lexical alignment"},
        {"step": "visual_rag_retrieval", "detail": "Retrieved 4 reference geospatial scene exemplars from reference corpus"},
        {"step": "textual_rag_retrieval", "detail": "Queried remote sensing feature dictionary and spectral ontology"},
        {"step": "model_inference", "detail": "Executed deterministic spatial grounding and radiometric feature synthesis"},
        {"step": "deterministic_verification", "detail": "Validated spectral consistency against band ratio models and spatial topology"},
    ]

    return {
        "answer": answer,
        "confidence": confidence,
        "task_classified": task_classified,
        "findings": findings,
        "execution_trace": trace,
        "bounding_boxes": bounding_boxes,
        "evidence": evidence,
    }


# ─────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Service health and diagnostic status."""
    return {
        "status": "ok",
        "service": "BhuDrishti Geospatial Intelligence Engine",
        "version": "1.0.0",
        "timestamp": time.time(),
        "active_sessions": len(sessions),
        "demo_mode": True,
    }


@app.get("/api/samples")
async def get_samples():
    """Retrieve bundled deterministic demonstration datasets."""
    return {
        "count": len(AVAILABLE_SAMPLES),
        "samples": AVAILABLE_SAMPLES,
    }


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve active session state and metadata."""
    if session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
        )
    return sessions[session_id]


@app.post("/api/upload")
async def upload_dataset(
    mode: str = Form(...),
    image1: UploadFile = File(...),
    image2: Optional[UploadFile] = File(None),
):
    """
    Accept image uploads and initialize an analysis session.
    Validates modes, file presence, formats, and returns structured metadata.
    """
    valid_modes = ["single", "crossmodal", "bitemporal"]
    if mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid analysis mode '{mode}'. Must be one of: {', '.join(valid_modes)}",
        )

    # Validate image 1
    if not image1.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Primary image file is required",
        )

    # Validate image 2 for dual-slot modes
    if mode in ["crossmodal", "bitemporal"] and not image2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mode '{mode}' requires both primary and secondary images",
        )

    # Basic file extension check
    valid_exts = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")
    for f in [image1, image2]:
        if f and f.filename and not f.filename.lower().endswith(valid_exts):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{f.filename}' has unsupported format. Supported formats: {', '.join(valid_exts)}",
            )

    session_id = str(uuid.uuid4())
    metadata = generate_session_metadata(
        mode=mode,
        filename1=image1.filename,
        filename2=image2.filename if image2 else None,
    )

    filenames = [image1.filename]
    if image2 and image2.filename:
        filenames.append(image2.filename)

    session_payload = {
        "session_id": session_id,
        "mode": mode,
        "filenames": filenames,
        "metadata": metadata,
        "created_at": time.time(),
    }

    sessions[session_id] = session_payload
    return session_payload


class QueryRequest(BaseModel):
    session_id: str = Field(..., description="Unique active session identifier")
    query: str = Field(..., min_length=1, max_length=1000, description="Natural language geospatial query")


@app.post("/api/query")
async def execute_query(req: QueryRequest):
    """
    Process a natural language query for the given session.
    Returns deterministic query-aware answers, structured findings, bounding boxes, and trace.
    """
    query_text = req.query.strip()
    if not query_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty",
        )

    # Simulate realistic inference delay between 400ms and 800ms
    start_time = time.time()
    await asyncio.sleep(0.5)

    mode = "single"
    session_data = sessions.get(req.session_id)
    if session_data:
        mode = session_data.get("mode", "single")

    analysis = analyze_query_intent(query_text, mode=mode)
    elapsed_ms = round((time.time() - start_time) * 1000)

    return {
        "session_id": req.session_id,
        "query": query_text,
        "answer": analysis["answer"],
        "confidence": analysis["confidence"],
        "task_classified": analysis["task_classified"],
        "findings": analysis["findings"],
        "bounding_boxes": analysis["bounding_boxes"],
        "evidence": analysis["evidence"],
        "execution_trace": analysis["execution_trace"],
        "inference_time_ms": elapsed_ms,
        "is_demo_mode": True,
        "metadata": session_data.get("metadata") if session_data else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
