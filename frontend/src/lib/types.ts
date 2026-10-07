// Core domain types for BhuDrishti Geospatial Intelligence Platform

export type AnalysisMode = 'single' | 'crossmodal' | 'bitemporal';

export type SensorFilter = 'truecolor' | 'grayscale' | 'ndvi' | 'ndwi' | 'heatmap';

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
  metadata: ImageMetadata;
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

export type FindingSeverity = 'Info' | 'Warning' | 'Critical';

export interface Finding {
  category: string;
  title: string;
  description: string;
  confidence: number;
  severity: FindingSeverity;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
}

export interface EvidenceItem {
  type: string;
  metric: string;
  value: string;
  status: 'Verified' | 'Consistent' | 'Unverified';
}

export interface ExecutionStep {
  step: string;
  detail: string;
}

export interface QueryResult {
  session_id: string;
  query: string;
  answer: string;
  confidence: number;
  task_classified: string;
  findings: Finding[];
  bounding_boxes: BoundingBox[];
  evidence: EvidenceItem[];
  execution_trace: ExecutionStep[];
  inference_time_ms: number;
  is_demo_mode?: boolean;
}
