import type { Session, QueryResult, AnalysisMode, SampleDataset } from './types';

const BASE = '/api';

export const BUNDLED_SAMPLES: SampleDataset[] = [
  {
    id: 'sample-optical',
    title: 'Urban Built-Up & Infrastructure',
    mode: 'single',
    sensor: 'Sentinel-2A (ESA)',
    file1: '/sample_optical.jpg',
    description: 'High-density metropolitan area with road grids, commercial blocks, and vegetation patches.',
    location: { lat: 28.6139, lon: 77.2090, city: 'Delhi Capital Region' },
  },
  {
    id: 'sample-crossmodal',
    title: 'Optical + C-Band SAR Co-Registration',
    mode: 'crossmodal',
    sensor: 'Sentinel-2A + Sentinel-1B SAR',
    file1: '/sample_optical.jpg',
    file2: '/sample_sar.jpg',
    description: 'Multi-sensor cross-modal scene pairing optical true-color with synthetic aperture radar backscatter.',
    location: { lat: 18.9220, lon: 72.8347, city: 'Mumbai Coastal Zone' },
  },
  {
    id: 'sample-bitemporal',
    title: 'Bi-Temporal Coastal Flood Inundation',
    mode: 'bitemporal',
    sensor: 'Cartosat-2S (ISRO)',
    file1: '/sample_before.jpg',
    file2: '/sample_after.jpg',
    description: 'Pre-event baseline and post-monsoon flood inundation sequence assessing submerged surfaces.',
    location: { lat: 20.2961, lon: 85.8245, city: 'Mahanadi Delta AOI' },
  },
];

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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Upload failed: ${res.statusText}`);
  }
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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Query failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSamples(): Promise<SampleDataset[]> {
  try {
    const res = await fetch(`${BASE}/samples`);
    if (res.ok) {
      const data = await res.json();
      if (data.samples && Array.isArray(data.samples)) {
        return data.samples;
      }
    }
  } catch {
    // Backend offline: use bundled definitions
  }
  return BUNDLED_SAMPLES;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic client-side mock implementation for offline mode
// ─────────────────────────────────────────────────────────────────────────────

export function mockUpload(mode: AnalysisMode, sample?: SampleDataset): Session {
  const sensor = sample?.sensor ?? (
    mode === 'crossmodal' ? 'Sentinel-2A + Sentinel-1B SAR' :
    mode === 'bitemporal' ? 'Cartosat-2S (ISRO)' : 'Sentinel-2A (ESA)'
  );
  const lat = sample?.location.lat ?? 28.6139;
  const lon = sample?.location.lon ?? 77.2090;

  return {
    session_id: crypto.randomUUID(),
    mode,
    metadata: {
      sensor,
      crs: 'EPSG:32643 (UTM Zone 43N)',
      resolution_m: mode === 'crossmodal' ? 10.0 : 0.65,
      scene_center: { lat, lon },
      acquisition_date: '2024-03-15',
      cloud_cover_pct: 1.4,
      num_bands: mode === 'crossmodal' ? 14 : 12,
      size_px: [1024, 1024],
      is_synthetic_demo: true,
    },
  };
}

export function mockQuery(queryText: string, mode: AnalysisMode = 'single'): QueryResult {
  const q = queryText.toLowerCase().trim();

  const is_construction = ['construction', 'built', 'building', 'structure', 'urban', 'house', 'warehouse', 'industrial', 'road', 'paved'].some(k => q.includes(k));
  const is_vegetation = ['vegetation', 'tree', 'forest', 'green', 'agriculture', 'crop', 'farm', 'canopy', 'ndvi'].some(k => q.includes(k));
  const is_water = ['water', 'flood', 'inundat', 'river', 'lake', 'ocean', 'pond', 'drainage', 'submerge', 'ndwi'].some(k => q.includes(k));
  const is_change = ['change', 'before', 'after', 'differ', 'shift', 'loss', 'gain', 'increase', 'decrease', 'compare'].some(k => q.includes(k));
  const is_sar = ['sar', 'radar', 'backscatter', 'polarimetric', 'cross-modal', 'fusion'].some(k => q.includes(k));
  const is_grounding = ['where', 'locate', 'find', 'detect', 'ground', 'box', 'region'].some(k => q.includes(k));

  if (mode === 'bitemporal' || is_change) {
    return {
      session_id: 'demo-session',
      query: queryText,
      answer: 'Bi-temporal comparison indicates significant surface water expansion over the observed timeframe. Submerged acreage increased by approximately 31.8% across low-elevation agricultural and riparian parcels. Road accessibility in the southern quadrant shows moderate disruption.',
      confidence: 91,
      task_classified: 'change-vqa',
      findings: [
        {
          category: 'Hydrology',
          title: 'Flood Water Inundation',
          description: 'Low near-infrared reflectance and elevated NDWI values indicate widespread inundation in river drainage channels.',
          confidence: 94,
          severity: 'Warning',
        },
        {
          category: 'Land-Cover Transition',
          title: 'Surface Water Encroachment',
          description: 'Submerged parcel boundaries detected across previously dry peripheral agricultural plots.',
          confidence: 88,
          severity: 'Warning',
        },
      ],
      bounding_boxes: [
        { id: 'box-w1', x: 18.0, y: 42.0, w: 28.5, h: 22.0, label: 'surface water body', confidence: 94 },
        { id: 'box-w2', x: 58.0, y: 62.0, w: 24.0, h: 19.5, label: 'inundated parcel', confidence: 89 },
      ],
      evidence: [
        { type: 'Spectral Metric', metric: 'NDWI Delta', value: '+0.38 mean increase', status: 'Consistent' },
        { type: 'NIR Attenuation', metric: 'Band 8 Absorption', value: '74% reduction', status: 'Verified' },
        { type: 'Temporal Baseline', metric: 'Epoch Interval', value: '14 days', status: 'Verified' },
      ],
      execution_trace: [
        { step: 'task_classification', detail: "Classified as 'change-vqa' with high temporal correlation" },
        { step: 'visual_rag_retrieval', detail: '3 bi-temporal flood reference pairs matched' },
        { step: 'textual_rag_retrieval', detail: 'Consulted hydrological flood extent protocols' },
        { step: 'model_inference', detail: 'Executed change vector analysis and thresholding' },
        { step: 'deterministic_verification', detail: 'Topographic contour verification confirms drainage alignment' },
      ],
      inference_time_ms: 640,
      is_demo_mode: true,
    };
  }

  if (is_water) {
    return {
      session_id: 'demo-session',
      query: queryText,
      answer: 'Hydrological detection reveals localized water bodies with distinct absorption in near-infrared and shortwave infrared bands. Mean NDWI reaches +0.34, confirming high surface moisture and standing water reservoirs.',
      confidence: 93,
      task_classified: 'grounding',
      findings: [
        {
          category: 'Hydrology',
          title: 'Open Water Retention',
          description: 'Strong SWIR absorption delineates permanent and ephemeral standing water surfaces.',
          confidence: 95,
          severity: 'Info',
        },
      ],
      bounding_boxes: [
        { id: 'box-w1', x: 20.0, y: 40.0, w: 26.0, h: 20.0, label: 'water body', confidence: 95 },
        { id: 'box-w2', x: 62.0, y: 58.0, w: 20.0, h: 18.0, label: 'saturated marsh', confidence: 88 },
      ],
      evidence: [
        { type: 'Spectral Index', metric: 'NDWI (Green - NIR)', value: '+0.34', status: 'Verified' },
        { type: 'Reflectance Ratio', metric: 'Band 3 / Band 8', value: '3.12', status: 'Consistent' },
      ],
      execution_trace: [
        { step: 'task_classification', detail: "Classified as 'grounding' targeting water bodies" },
        { step: 'visual_rag_retrieval', detail: 'Retrieved 2 wetland exemplars from spectral catalog' },
        { step: 'textual_rag_retrieval', detail: 'Loaded NDWI threshold models' },
        { step: 'model_inference', detail: 'Calculated pixel-level water mask' },
        { step: 'deterministic_verification', detail: 'Confirmed spectral absorption profile' },
      ],
      inference_time_ms: 580,
      is_demo_mode: true,
    };
  }

  if (is_vegetation) {
    return {
      session_id: 'demo-session',
      query: queryText,
      answer: 'Vegetation canopy analysis indicates healthy biomass across the peripheral sub-regions. Normalized Difference Vegetation Index (NDVI) values average 0.56 in vegetated patches, with dense continuous canopy observed along riparian corridors.',
      confidence: 90,
      task_classified: 'single-image-vqa',
      findings: [
        {
          category: 'Biomass',
          title: 'Active Photosynthetic Canopy',
          description: 'High near-infrared reflectance confirms active chlorophyll concentration in green sectors.',
          confidence: 92,
          severity: 'Info',
        },
      ],
      bounding_boxes: [
        { id: 'box-v1', x: 52.0, y: 16.0, w: 34.0, h: 26.0, label: 'dense vegetation canopy', confidence: 93 },
        { id: 'box-v2', x: 14.0, y: 64.0, w: 24.0, h: 20.0, label: 'sparse green buffer', confidence: 86 },
      ],
      evidence: [
        { type: 'Vegetation Index', metric: 'NDVI (NIR - Red)', value: '0.56 mean', status: 'Verified' },
        { type: 'Red Edge Ratio', metric: 'Band 5 / Band 4', value: '2.38', status: 'Consistent' },
      ],
      execution_trace: [
        { step: 'task_classification', detail: "Classified as 'single-image-vqa' for vegetation cover" },
        { step: 'visual_rag_retrieval', detail: 'Retrieved 3 canopy spectral profiles' },
        { step: 'textual_rag_retrieval', detail: 'Consulted botanical index classifications' },
        { step: 'model_inference', detail: 'Calculated radiometric vegetation indices' },
        { step: 'deterministic_verification', detail: 'Verified chlorophyll absorption edge' },
      ],
      inference_time_ms: 510,
      is_demo_mode: true,
    };
  }

  if (is_construction || is_grounding) {
    return {
      session_id: 'demo-session',
      query: queryText,
      answer: 'Structural analysis identifies key built-up clusters with distinct rectangular footprints. High spatial frequency edge detection and shadow alignment indicate vertical concrete and masonry structures along primary transportation routes.',
      confidence: 94,
      task_classified: 'grounding',
      findings: [
        {
          category: 'Built Environment',
          title: 'High-Density Built-Up Fabric',
          description: 'Impervious surface fraction exceeds 78% in central quadrants with prominent roofing reflectance.',
          confidence: 96,
          severity: 'Info',
        },
        {
          category: 'Infrastructure',
          title: 'Commercial Facility Footprint',
          description: 'Identified contiguous facility boundaries with connected roadway access.',
          confidence: 91,
          severity: 'Info',
        },
      ],
      bounding_boxes: [
        { id: 'box-c1', x: 22.0, y: 28.0, w: 26.0, h: 20.0, label: 'commercial / warehouse facility', confidence: 96 },
        { id: 'box-c2', x: 55.0, y: 48.0, w: 30.0, h: 24.0, label: 'dense residential block', confidence: 91 },
        { id: 'box-c3', x: 15.0, y: 70.0, w: 20.0, h: 16.0, label: 'transport infrastructure', confidence: 88 },
      ],
      evidence: [
        { type: 'Texture Metric', metric: 'Sobel Edge Magnitude', value: 'High directional gradient', status: 'Verified' },
        { type: 'Index Evaluation', metric: 'NDBI (SWIR - NIR)', value: '+0.24', status: 'Consistent' },
      ],
      execution_trace: [
        { step: 'task_classification', detail: "Classified as 'grounding' targeting structures" },
        { step: 'visual_rag_retrieval', detail: 'Matched urban infrastructure morphological signatures' },
        { step: 'textual_rag_retrieval', detail: 'Queried civil infrastructure topology index' },
        { step: 'model_inference', detail: 'Generated oriented bounding annotations' },
        { step: 'deterministic_verification', detail: 'Cross-validated against solar shadow azimuth' },
      ],
      inference_time_ms: 620,
      is_demo_mode: true,
    };
  }

  if (mode === 'crossmodal' || is_sar) {
    return {
      session_id: 'demo-session',
      query: queryText,
      answer: 'Cross-modal synthesis merges optical multispectral imagery with Synthetic Aperture Radar (SAR) backscatter. Strong double-bounce returns validate structural building facades, while low backscatter delineates smooth open ground and calm water surfaces.',
      confidence: 90,
      task_classified: 'fusion',
      findings: [
        {
          category: 'Cross-Modal Correlation',
          title: 'SAR Double-Bounce Structural Alignment',
          description: 'High C-band VV/VH cross-polarization ratio coincides precisely with optical building perimeters.',
          confidence: 93,
          severity: 'Info',
        },
      ],
      bounding_boxes: [
        { id: 'box-s1', x: 30.0, y: 25.0, w: 28.0, h: 22.0, label: 'radar double-bounce structural target', confidence: 93 },
        { id: 'box-s2', x: 62.0, y: 55.0, w: 24.0, h: 20.0, label: 'low-backscatter specular ground', confidence: 87 },
      ],
      evidence: [
        { type: 'Polarimetric Ratio', metric: 'VH / VV Backscatter', value: '-14.2 dB / -7.8 dB', status: 'Verified' },
        { type: 'Coregistration', metric: 'Residual Alignment Error', value: '0.24 pixels RMSE', status: 'Consistent' },
      ],
      execution_trace: [
        { step: 'task_classification', detail: "Classified as 'fusion' combining optical and SAR" },
        { step: 'visual_rag_retrieval', detail: 'Retrieved multi-modal co-registered pairs' },
        { step: 'textual_rag_retrieval', detail: 'Loaded microwave dielectric response database' },
        { step: 'model_inference', detail: 'Fitted multi-sensor joint feature space' },
        { step: 'deterministic_verification', detail: 'Specular reflection confirmed by polarimetry' },
      ],
      inference_time_ms: 670,
      is_demo_mode: true,
    };
  }

  // General fallback
  return {
    session_id: 'demo-session',
    query: queryText,
    answer: 'Comprehensive scene assessment reveals a composite landscape featuring mixed land-use classes: approximately 48% built-up surface, 32% active or semi-vegetated terrain, and 20% open or transition ground. Spatial coherence and spectral signatures remain consistent across all spectral channels.',
    confidence: 88,
    task_classified: 'single-image-vqa',
    findings: [
      {
        category: 'Land-Use Classification',
        title: 'Macro Landscape Partitioning',
        description: 'Spectral clusters separate clearly into urban infrastructure, vegetative cover, and bare soil.',
        confidence: 90,
        severity: 'Info',
      },
    ],
    bounding_boxes: [
      { id: 'box-g1', x: 20.0, y: 20.0, w: 35.0, h: 28.0, label: 'primary urban cluster', confidence: 92 },
      { id: 'box-g2', x: 60.0, y: 45.0, w: 28.0, h: 32.0, label: 'mixed vegetation buffer', confidence: 85 },
    ],
    evidence: [
      { type: 'Clustering Metric', metric: 'Davies-Bouldin Index', value: '0.62', status: 'Consistent' },
      { type: 'Radiance Calibration', metric: 'Dynamic Range', value: 'TOA Reflectance [0.02, 0.74]', status: 'Verified' },
    ],
    execution_trace: [
      { step: 'task_classification', detail: "Classified as 'single-image-vqa' general land cover" },
      { step: 'visual_rag_retrieval', detail: 'Retrieved 4 scene exemplars from reference corpus' },
      { step: 'textual_rag_retrieval', detail: 'Queried remote sensing feature dictionary' },
      { step: 'model_inference', detail: 'Synthesized land use class proportions' },
      { step: 'deterministic_verification', detail: 'Validated radiometric consistency across bands' },
    ],
    inference_time_ms: 540,
    is_demo_mode: true,
  };
}
