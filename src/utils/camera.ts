/**
 * Camera and Device Manager for Ahmed Reaction Studio
 * Platform detection, device enumeration, constraint negotiation,
 * resolution ladder fallback, and Android 2-camera cap enforcement.
 */

import { createProceduralCommentatorStream } from '../data/sampleMedia';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facingMode?: 'user' | 'environment';
}

export function detectPlatform(): 'android' | 'windows' | 'macos' | 'ios' | 'linux' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/i.test(ua)) return 'android';
  if (/win(dows|32|64)/i.test(ua)) return 'windows';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/macintosh|mac os x/i.test(ua)) return 'macos';
  if (/linux/i.test(ua)) return 'linux';
  return 'unknown';
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) || 
    (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
}

export async function enumerateCameras(): Promise<CameraDeviceInfo[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    return videoDevices.map((device, index) => {
      let facingMode: 'user' | 'environment' | undefined = undefined;
      const labelLower = (device.label || '').toLowerCase();
      if (labelLower.includes('front') || labelLower.includes('user') || labelLower.includes('facetime')) {
        facingMode = 'user';
      } else if (labelLower.includes('back') || labelLower.includes('rear') || labelLower.includes('environment')) {
        facingMode = 'environment';
      }

      return {
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}${facingMode ? ` (${facingMode})` : ''}`,
        facingMode
      };
    });
  } catch (err) {
    console.warn('Error enumerating cameras:', err);
    return [];
  }
}

const RESOLUTION_LADDER = [
  { width: 1920, height: 1080, label: '1080p' },
  { width: 1280, height: 720, label: '720p' },
  { width: 854, height: 480, label: '480p' },
  { width: 640, height: 360, label: '360p' }
];

export interface ExportCodecOption {
  mimeType: string;
  label: string;
  format: 'mp4' | 'webm';
  supported: boolean;
}

export function getSupportedExportCodecs(): ExportCodecOption[] {
  const options: { mime: string; label: string; format: 'mp4' | 'webm' }[] = [
    { mime: 'video/mp4;codecs=avc1,mp4a', label: 'MP4 (H.264 / AAC) - Maximum Compatibility', format: 'mp4' },
    { mime: 'video/mp4', label: 'MP4 (Default H.264)', format: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', label: 'WebM (VP9 / Opus) - High Efficiency', format: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', label: 'WebM (VP8 / Opus) - Standard Web', format: 'webm' },
    { mime: 'video/webm;codecs=h264,opus', label: 'WebM (H.264 / Opus)', format: 'webm' },
    { mime: 'video/webm', label: 'WebM (Standard)', format: 'webm' },
  ];

  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return options.map(o => ({ mimeType: o.mime, label: o.label, format: o.format, supported: false }));
  }

  return options.map(o => ({
    mimeType: o.mime,
    label: o.label,
    format: o.format,
    supported: MediaRecorder.isTypeSupported(o.mime)
  }));
}

export async function requestCameraStream(options: {
  deviceId?: string;
  facingMode?: 'user' | 'environment';
  existingCameraLayersCount?: number;
}): Promise<{
  stream: MediaStream;
  actualResolution: string;
  isMock: boolean;
  deviceId?: string;
  facingMode?: 'user' | 'environment';
  stop: () => void;
  error?: string;
}> {
  const platform = detectPlatform();

  // Enforce Android hard cap of 2 simultaneous physical cameras
  if (platform === 'android' && (options.existingCameraLayersCount || 0) >= 2) {
    throw new Error('Android hardware limit: Maximum of 2 simultaneous physical camera streams permitted.');
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn('getUserMedia not supported, using procedural simulated studio camera.');
    const mock = createProceduralCommentatorStream(
      options.facingMode === 'environment' ? 'Rear Camera (Simulated)' : 'Front Camera (Simulated)'
    );
    return {
      stream: mock.stream,
      actualResolution: '640x480 (Procedural)',
      isMock: true,
      facingMode: options.facingMode || 'user',
      stop: mock.stop
    };
  }

  // Attempt resolution ladder fallback
  for (const res of RESOLUTION_LADDER) {
    try {
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: res.width },
        height: { ideal: res.height }
      };

      if (options.deviceId) {
        videoConstraints.deviceId = { ideal: options.deviceId };
      } else if (options.facingMode) {
        videoConstraints.facingMode = { ideal: options.facingMode };
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const resStr = `${settings.width || res.width}x${settings.height || res.height}`;

      return {
        stream,
        actualResolution: resStr,
        isMock: false,
        deviceId: settings.deviceId,
        facingMode: (settings.facingMode as 'user' | 'environment') || options.facingMode,
        stop: () => {
          stream.getTracks().forEach(track => track.stop());
        }
      };
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      // If Overconstrained, proceed to next rung on ladder
      if (err.name === 'OverconstrainedError') {
        continue;
      }
      // If permission denied or not found in an iframe, provide simulated procedural camera
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'SecurityError') {
        console.warn(`Camera access issue (${err.name}), falling back to procedural studio commentator.`);
        const mock = createProceduralCommentatorStream(
          options.facingMode === 'environment' ? 'Rear Camera (Simulated)' : 'Front Camera (Simulated)'
        );
        return {
          stream: mock.stream,
          actualResolution: '640x480 (Simulated)',
          isMock: true,
          facingMode: options.facingMode || 'user',
          stop: mock.stop,
          error: `${err.name}: ${err.message || 'Camera permission not granted. Simulated camera activated.'}`
        };
      }
    }
  }

  // Final fallback to mock commentator
  const mock = createProceduralCommentatorStream(
    options.facingMode === 'environment' ? 'Rear Camera (Simulated)' : 'Front Camera (Simulated)'
  );
  return {
    stream: mock.stream,
    actualResolution: '640x480 (Simulated)',
    isMock: true,
    facingMode: options.facingMode || 'user',
    stop: mock.stop,
    error: 'All camera resolution constraints failed. Procedural stream active.'
  };
}

export async function requestScreenStream(): Promise<{
  stream: MediaStream;
  stop: () => void;
}> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen capture (getDisplayMedia) is not supported on this browser/device.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always'
    } as MediaTrackConstraints,
    audio: true
  });

  return {
    stream,
    stop: () => {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}
