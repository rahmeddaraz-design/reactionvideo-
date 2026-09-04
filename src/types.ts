/**
 * Types and interfaces for Ahmed Reaction Studio
 */

export type CanvasAspectRatio = '16:9' | '9:16' | '1:1';

export interface CanvasResolution {
  width: number;
  height: number;
  label: string;
}

export type LayerType = 'video' | 'camera' | 'screen' | 'image';

export type LayerFitMode = 'contain' | 'cover' | 'stretch';

export interface NormalizedGeometry {
  x: number; // 0.0 to 1.0 (relative to canvas width)
  y: number; // 0.0 to 1.0 (relative to canvas height)
  w: number; // 0.0 to 1.0
  h: number; // 0.0 to 1.0
}

export interface StudioLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  muted: boolean;
  volume: number; // 0.0 to 1.0
  playing: boolean;
  geometry: NormalizedGeometry;
  fitMode: LayerFitMode;
  aspectLocked: boolean;
  sourceAspectRatio?: number;
  cornerRadius: number; // in pixels at 1080p
  borderWidth: number; // in pixels
  borderColor: string;
  opacity: number; // 0.0 to 1.0
  mirrored?: boolean; // Horizontal flip for front camera
  facingMode?: 'user' | 'environment'; // Camera lens orientation
  playbackRate?: number; // Video playback speed 0.5x - 2.0x
  loop?: boolean; // Loop video layer
  
  // Media source handles
  sourceUrl?: string;
  fileName?: string;
  deviceId?: string;
  isMockSource?: boolean;
  
  // Runtime video element reference (not serialized)
  mediaElement?: HTMLVideoElement | HTMLImageElement | null;
  stream?: MediaStream | null;
  currentTime: number;
  duration: number;
}

export interface RecordQualityConfig {
  resolutionPreset: '4k' | '1080p' | '720p' | '480p';
  targetFps: 60 | 30 | 24;
  videoBitrate: number; // in bps, e.g. 5000000 = 5 Mbps
  audioBitrate: number; // in bps, e.g. 192000 = 192 kbps
  preferredMimeType: string;
  autoRewindOnRecord: boolean;
}

export type HandleType = 
  | 'nw' | 'n' | 'ne' 
  | 'w'  |       'e' 
  | 'sw' | 's' | 'se' 
  | 'move';

export interface PresetLayout {
  id: string;
  name: string;
  iconName: string;
  description: string;
  getGeometry: (aspectRatio: CanvasAspectRatio, sourceAspect?: number) => NormalizedGeometry;
}

export type TimelineActionType = 
  | 'play'
  | 'pause'
  | 'seek'
  | 'visibility_on'
  | 'visibility_off'
  | 'mute'
  | 'unmute'
  | 'volume'
  | 'geometry_change'
  | 'layer_add'
  | 'layer_remove'
  | 'layer_reorder';

export interface TimelineEvent {
  id: string;
  layerId: string;
  layerName: string;
  action: TimelineActionType;
  wallMs: number;
  mediaTime: number;
  payload?: Record<string, unknown>;
}

export interface RecordingTake {
  id: string;
  name: string;
  timestamp: string;
  durationMs: number;
  blobUrl: string;
  blobSize: number;
  mimeType: string;
  canvasAspect: CanvasAspectRatio;
}

export interface SystemDiagnostics {
  platform: 'windows' | 'android' | 'linux' | 'macos' | 'ios' | 'unknown';
  isMobile: boolean;
  isTermuxEnvironment: boolean;
  browserName: string;
  dpr: number;
  screenResolution: string;
  canvasRenderFps: number;
  droppedFrames: number;
  audioSupported: boolean;
  mediaDevicesSupported: boolean;
  camerasCount: number;
  cameraLabels: string[];
  mediaRecorderSupported: boolean;
  supportedCodecs: string[];
}
