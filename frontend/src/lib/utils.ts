import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function confidenceColor(value: number): string {
  if (value >= 85) return '#39ff14';
  if (value >= 70) return '#00d9ff';
  if (value >= 55) return '#ffb020';
  return '#ff3b3b';
}

export function formatCoord(value: number, isLat: boolean): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${deg}°${min}'${sec}"${dir}`;
}

export function formatTimestamp(d: Date): string {
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const TASK_LABELS: Record<string, string> = {
  'single-image-vqa': 'SINGLE-IMAGE VQA',
  'change-vqa': 'BI-TEMPORAL CHANGE',
  'fusion': 'CROSS-MODAL FUSION',
  'grounding': 'VISUAL GROUNDING',
};

export const TASK_COLORS: Record<string, string> = {
  'single-image-vqa': '#00d9ff',
  'change-vqa': '#ffb020',
  'fusion': '#a855f7',
  'grounding': '#39ff14',
};

export const STEP_ICONS: Record<string, string> = {
  'task_classification': '⬡',
  'visual_rag_retrieval': '◈',
  'textual_rag_retrieval': '◉',
  'model_inference': '▣',
  'deterministic_verification': '✔',
};
