// Core types for SatQuery AI

export type AnalysisMode = 'single' | 'crossmodal' | 'bitemporal';

export type SensorFilter = 'truecolor' | 'grayscale' | 'ndvi' | 'ndwi' | 'heatmap';

export type TaskClassified = 'single-image-vqa' | 'change-vqa' | 'fusion' | 'grounding';

export interface BoundingBox {
  x: number;      // percentage of image width
  y: number;      // percentage of image height
  w: number;      // percentage of image width
  h: number;      // percentage of image height
  label: string;
  confidence: number;
}

export interface ExecutionTraceStep {
  step: string;
  detail: string;
}

export interface QueryResult {
  answer: string;
  confidence: number;
  task_classified: TaskClassified;
  execution_trace: ExecutionTraceStep[];
  bounding_boxes: BoundingBox[];
  inference_time_ms: number;
}

export interface ImageMetadata {
  sensor: string;
  crs: string;
  resolution_m: number;
  scene_center: { lat: number; lon: number };
  acquisition_date: string;
  cloud_cover_pct: number;
  num_bands: number;
  size_px: [number, number];
}

export interface Session {
  session_id: string;
  mode: AnalysisMode;
  metadata: ImageMetadata;
}

export interface ReticlePoint {
  x: number;   // % of image
  y: number;   // % of image
  ndvi: number;
  classLabel: string;
  classConf: number;
  lat: number;
  lon: number;
}

export interface UploadedImages {
  primary: File | null;
  secondary: File | null;
  primaryPreview: string | null;
  secondaryPreview: string | null;
}
