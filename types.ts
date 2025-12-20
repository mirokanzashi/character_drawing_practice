
export interface PracticeSession {
  id: string;
  timestamp: number;
  referenceImage: string;
  userDrawing: string;
  feedback?: string;
}

export interface BrushSettings {
  color: string;
  size: number;
  isEraser: boolean;
}

export interface ProcessorSettings {
  sensitivity: number;
  contrast: number;
  threshold: number;
}

// Export Character and PoseType for constants.ts
export interface Character {
  id: string;
  name: string;
  series: string;
}

export type PoseType = '三面図' | '喜怒哀楽' | 'あおり' | '俯瞰' | '立ち絵';
