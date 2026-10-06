// Core types for BhuDrishti Geospatial Intelligence Platform

export type AnalysisMode = 'single' | 'crossmodal' | 'bitemporal';

export type SensorFilter = 'truecolor' | 'grayscale' | 'ndvi' | 'ndwi' | 'heatmap';

export type TaskClassified = 'single-image-vqa' | 'change-vqa' | 'fusion' | 'grounding';

export interface BoundingBox {
  id?: string;
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

export interface FindingItem {
  category: string;
  title: string;
  description: string;
  confidence: number;
  severity?: 'Info' | 'Warning' | 'Critical';
}

export interface EvidenceItem {
  type: string;
  metric: string;
  value: string;
  status: string;
}

export interface QueryResult {
  session_id?: string;
  query?: string;
  answer: string;
  confidence: number;
  task_classified: TaskClassified;
  findings: FindingItem[];
  execution_trace: ExecutionTraceStep[];
  bounding_boxes: BoundingBox[];
  evidence?: EvidenceItem[];
  inference_time_ms: number;
  is_demo_mode?: boolean;
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
  is_synthetic_demo?: boolean;
}

export interface Session {
  session_id: string;
  mode: AnalysisMode;
  filenames?: string[];
  metadata: ImageMetadata;
}

export interface ReticlePoint {
  x: number;   // % of image
  y: number;   // % of image
  ndvi: number;
  ndwi?: number;
  classLabel: string;
  classConf: number;
  lat: number;
  lon: number;
  changeState?: string;
}

export interface UploadedImages {
  primary: File | null;
  secondary: File | null;
  primaryPreview: string | null;
  secondaryPreview: string | null;
}

export interface SampleDataset {
  id: string;
  title: string;
  mode: AnalysisMode;
  sensor: string;
  file1: string;
  file2?: string;
  description: string;
  location: { lat: number; lon: number; city: string };
}
