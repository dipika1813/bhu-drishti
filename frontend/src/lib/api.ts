import type { Session, QueryResult, AnalysisMode } from './types';

const BASE = '/api';

export async function uploadImages(
  mode: AnalysisMode,
  image1: File,
  image2?: File
): Promise<Session> {
  const form = new FormData();
  form.append('mode', mode);
  form.append('image1', image1);
  if (image2) form.append('image2', image2);

  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function submitQuery(
  session_id: string,
  query: string
): Promise<QueryResult> {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, query }),
  });
  if (!res.ok) throw new Error(`Query failed: ${res.statusText}`);
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Dev-mode fallback mock (used when backend is offline) ─────────────────
export function mockUpload(mode: AnalysisMode): Session {
  const sensors = ['Sentinel-2A (ESA)', 'WorldView-3 (Maxar)', 'Cartosat-2S (ISRO)'];
  return {
    session_id: crypto.randomUUID(),
    mode,
    metadata: {
      sensor: sensors[Math.floor(Math.random() * sensors.length)],
      crs: 'EPSG:32643 (UTM Zone 43N)',
      resolution_m: +(Math.random() * 5 + 0.5).toFixed(2),
      scene_center: { lat: 28.6139 + Math.random() * 0.1, lon: 77.209 + Math.random() * 0.1 },
      acquisition_date: '2024-03-15',
      cloud_cover_pct: +(Math.random() * 10).toFixed(1),
      num_bands: 12,
      size_px: [1024, 1024],
    },
  };
}

export function mockQuery(): QueryResult {
  const answers = [
    'The scene shows high-density urban fabric occupying approximately 72% of the visible area. Vegetation patches are confined to the northeastern sector, with NDVI values consistent with sparse greenery (~0.31). The river corridor in the western portion shows minimal surface reflectance, indicative of clear water conditions.',
    'Change detection analysis reveals significant inundation: approximately 34 km² of formerly built-up land now shows spectral signatures consistent with standing water. The affected residential zones in the southern quadrant register coherence loss consistent with flood damage.',
    'Cross-modal fusion analysis identifies 7 candidate structures with both high SAR backscatter and characteristic optical texture. The largest cluster (northeastern sector) spans approximately 280×190 meters, consistent with industrial warehousing infrastructure.',
    'Object grounding complete: 3 candidate regions identified matching the queried morphology. Primary detection at 83% class confidence in the central zone; secondary cluster in the southwest shows 71% probability.',
  ];
  const tasks = ['single-image-vqa', 'change-vqa', 'fusion', 'grounding'] as const;
  const task = tasks[Math.floor(Math.random() * tasks.length)];
  return {
    answer: answers[Math.floor(Math.random() * answers.length)],
    confidence: Math.floor(Math.random() * 30 + 65),
    task_classified: task,
    inference_time_ms: Math.floor(Math.random() * 700 + 800),
    execution_trace: [
      { step: 'task_classification', detail: `Classified as '${task}' with 94% router confidence` },
      { step: 'visual_rag_retrieval', detail: '4 scene exemplars retrieved (cosine sim > 0.81)' },
      { step: 'textual_rag_retrieval', detail: '2 geospatial knowledge documents retrieved' },
      { step: 'model_inference', detail: 'RemoteCLIP-ViT-L/14 invoked; token budget 512' },
      { step: 'deterministic_verification', detail: 'NDWI delta agrees with flood claim' },
    ],
    bounding_boxes: task === 'grounding' ? [
      { x: 25, y: 30, w: 18, h: 14, label: 'industrial', confidence: 87 },
      { x: 55, y: 60, w: 12, h: 10, label: 'built-up', confidence: 73 },
    ] : [],
  };
}
