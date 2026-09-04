import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  StudioLayer, 
  CanvasAspectRatio, 
  NormalizedGeometry, 
  TimelineEvent, 
  RecordingTake,
  RecordQualityConfig
} from './types';
import { STUDIO_PRESETS } from './utils/presets';
import { studioAudio } from './utils/audio';
import { requestCameraStream, requestScreenStream, isMobileDevice } from './utils/camera';
import { SAMPLE_VIDEOS } from './data/sampleMedia';
import { Header } from './components/Header';
import { CanvasStage } from './components/CanvasStage';
import { LayerList } from './components/LayerList';
import { LayerInspector } from './components/LayerInspector';
import { AudioMixer } from './components/AudioMixer';
import { TimelineScrubber } from './components/TimelineScrubber';
import { LocalVideoControlBar } from './components/LocalVideoControlBar';
import { RecordingModal } from './components/RecordingModal';
import { DeploymentModal } from './components/DeploymentModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { ExportQualityModal } from './components/ExportQualityModal';
import { 
  Layers, 
  Sliders, 
  Volume2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export default function App() {
  // Master Canvas Configuration
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>('16:9');
  const [zoomMode, setZoomMode] = useState<'fit' | 'fill' | '100%' | '75%'>('fit');
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Layers Stack
  const [layers, setLayers] = useState<StudioLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Audio Mixer State
  const [masterVolume, setMasterVolume] = useState(1.0);

  // Master Clock & Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(32);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  // Recording State & Quality Config
  const [isRecording, setIsRecording] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [takes, setTakes] = useState<RecordingTake[]>([]);
  const [selectedTake, setSelectedTake] = useState<RecordingTake | null>(null);
  const [isTakesModalOpen, setIsTakesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [recordQualityConfig, setRecordQualityConfig] = useState<RecordQualityConfig>({
    resolutionPreset: '1080p',
    targetFps: 30,
    videoBitrate: 5000000,
    audioBitrate: 192000,
    preferredMimeType: 'video/webm',
    autoRewindOnRecord: true
  });

  // Modals & Navigation
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'canvas' | 'layers' | 'inspector' | 'audio' | 'timeline'>('canvas');
  const [isMobile, setIsMobile] = useState(false);

  // Diagnostics / Performance
  const [renderFps, setRenderFps] = useState(60);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFpsUpdateRef = useRef(performance.now());
  const framesCountRef = useRef(0);

  // Detect mobile environment and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Performance FPS counter
  useEffect(() => {
    let animId: number;
    const calcFps = () => {
      framesCountRef.current++;
      const now = performance.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setRenderFps(framesCountRef.current);
        framesCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Add event helper
  const logTimelineEvent = useCallback((action: TimelineEvent['action'], layerId: string, layerName: string, payload?: Record<string, unknown>) => {
    const newEvent: TimelineEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      layerId,
      layerName,
      action,
      wallMs: performance.now(),
      mediaTime: currentTime,
      payload
    };
    setEvents(prev => [...prev.slice(-100), newEvent]); // Keep last 100 events
  }, [currentTime]);

  // Initialize Starter Project with a Reaction Video + Host Camera PiP
  useEffect(() => {
    let unmounted = false;

    const initDefaultStudio = async () => {
      // 1. Create Main Video layer with built-in sample clip
      const sample = SAMPLE_VIDEOS[0];
      const videoEl = document.createElement('video');
      videoEl.src = sample.url;
      videoEl.crossOrigin = 'anonymous';
      videoEl.loop = true;
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.autoplay = true;

      const mainLayer: StudioLayer = {
        id: 'layer-main-video',
        name: sample.name,
        type: 'video',
        visible: true,
        locked: true,
        muted: false,
        volume: 0.85,
        playing: true,
        geometry: { x: 0, y: 0, w: 1.0, h: 1.0 },
        fitMode: 'cover',
        aspectLocked: true,
        sourceAspectRatio: 16 / 9,
        cornerRadius: 0,
        borderWidth: 0,
        borderColor: '#38bdf8',
        opacity: 1.0,
        sourceUrl: sample.url,
        mediaElement: videoEl,
        currentTime: 0,
        duration: sample.duration
      };

      videoEl.play().catch(() => {});
      studioAudio.attachMediaElement(mainLayer.id, videoEl, mainLayer.volume, mainLayer.muted);

      // 2. Create Host Reaction Camera PiP (bottom right corner)
      try {
        const camRes = await requestCameraStream({
          facingMode: 'user',
          existingCameraLayersCount: 0
        });

        if (unmounted) {
          camRes.stop();
          return;
        }

        const camVideoEl = document.createElement('video');
        camVideoEl.srcObject = camRes.stream;
        camVideoEl.muted = true; // Avoid feedback loop in preview
        camVideoEl.playsInline = true;
        camVideoEl.autoplay = true;
        camVideoEl.play().catch(() => {});

        studioAudio.attachMediaStream('layer-host-camera', camRes.stream, 1.0, false);

        const camLayer: StudioLayer = {
          id: 'layer-host-camera',
          name: camRes.isMock ? 'Host Camera (Simulated)' : 'Host Webcam',
          type: 'camera',
          visible: true,
          locked: false,
          muted: false,
          volume: 1.0,
          playing: true,
          geometry: { x: 0.70, y: 0.68, w: 0.27, h: 0.28 },
          fitMode: 'cover',
          aspectLocked: true,
          sourceAspectRatio: 4 / 3,
          cornerRadius: 12,
          borderWidth: 2,
          borderColor: '#38bdf8',
          opacity: 1.0,
          mirrored: true, // Mirror selfie camera
          mediaElement: camVideoEl,
          stream: camRes.stream,
          isMockSource: camRes.isMock,
          currentTime: 0,
          duration: 0
        };

        setLayers([mainLayer, camLayer]);
        setSelectedLayerId(camLayer.id);
      } catch {
        setLayers([mainLayer]);
        setSelectedLayerId(mainLayer.id);
      }
    };

    initDefaultStudio();

    return () => {
      unmounted = true;
    };
  }, []);

  // Update current time continuously from main video layer
  useEffect(() => {
    const mainVideoLayer = layers.find(l => l.type === 'video' && l.mediaElement instanceof HTMLVideoElement);
    if (!mainVideoLayer || !(mainVideoLayer.mediaElement instanceof HTMLVideoElement)) return;

    const vid = mainVideoLayer.mediaElement;
    const updateTime = () => {
      setCurrentTime(vid.currentTime);
      if (vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
    };

    vid.addEventListener('timeupdate', updateTime);
    return () => vid.removeEventListener('timeupdate', updateTime);
  }, [layers]);

  // Master Volume handler
  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    studioAudio.setMasterVolume(vol);
  };

  // Layer Geometry update
  const handleUpdateLayerGeometry = (id: string, newGeom: NormalizedGeometry) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, geometry: newGeom };
      }
      return l;
    }));
  };

  // Layer Generic Prop update
  const handleUpdateLayerProp = <K extends keyof StudioLayer>(key: K, value: StudioLayer[K]) => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.map(l => {
      if (l.id === selectedLayerId) {
        return { ...l, [key]: value };
      }
      return l;
    }));
  };

  // Visibility toggle
  const handleToggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) {
        const nextVis = !l.visible;
        logTimelineEvent(nextVis ? 'visibility_on' : 'visibility_off', l.id, l.name);
        return { ...l, visible: nextVis };
      }
      return l;
    }));
  };

  // Lock toggle
  const handleToggleLock = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, locked: !l.locked };
      }
      return l;
    }));
  };

  // Mute toggle
  const handleToggleMute = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) {
        const nextMuted = !l.muted;
        studioAudio.setLayerVolume(l.id, l.volume, nextMuted);
        logTimelineEvent(nextMuted ? 'mute' : 'unmute', l.id, l.name);
        return { ...l, muted: nextMuted };
      }
      return l;
    }));
  };

  // Volume change
  const handleVolumeChange = (id: string, vol: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id) {
        studioAudio.setLayerVolume(l.id, vol, l.muted);
        return { ...l, volume: vol };
      }
      return l;
    }));
  };

  // Independent Play / Pause toggle per video layer
  const handleTogglePlayPause = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === id && l.mediaElement instanceof HTMLVideoElement) {
        const vid = l.mediaElement;
        if (l.playing) {
          vid.pause();
          logTimelineEvent('pause', l.id, l.name);
          return { ...l, playing: false };
        } else {
          vid.play().catch(() => {});
          logTimelineEvent('play', l.id, l.name);
          return { ...l, playing: true };
        }
      }
      return l;
    }));
  };

  // Video Transport Controls (Local video seek, skip +/- 5s/10s, speed, loop)
  const handleVideoSeek = (layerId: string, time: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.currentTime = time;
        return { ...l, currentTime: time };
      }
      return l;
    }));

    const firstVideo = layers.find(l => l.type === 'video');
    if (firstVideo && firstVideo.id === layerId) {
      setCurrentTime(time);
    }
  };

  const handleVideoSkip = (layerId: string, deltaSeconds: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.mediaElement instanceof HTMLVideoElement) {
        const current = l.mediaElement.currentTime || 0;
        const total = l.duration || l.mediaElement.duration || 60;
        const newTime = Math.max(0, Math.min(total, current + deltaSeconds));
        l.mediaElement.currentTime = newTime;
        return { ...l, currentTime: newTime };
      }
      return l;
    }));
  };

  const handleVideoSetSpeed = (layerId: string, speed: number) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.playbackRate = speed;
        return { ...l, playbackRate: speed };
      }
      return l;
    }));
  };

  const handleVideoToggleLoop = (layerId: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId && l.mediaElement instanceof HTMLVideoElement) {
        const nextLoop = !(l.loop ?? true);
        l.mediaElement.loop = nextLoop;
        return { ...l, loop: nextLoop };
      }
      return l;
    }));
  };

  // Camera Facing Switcher (Front <-> Back lens)
  const handleSwitchCameraFacing = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.type !== 'camera') return;
    const nextFacing: 'user' | 'environment' = layer.facingMode === 'environment' ? 'user' : 'environment';

    // Stop existing camera tracks
    if (layer.stream) {
      layer.stream.getTracks().forEach(t => t.stop());
    }

    try {
      const camRes = await requestCameraStream({
        facingMode: nextFacing,
        existingCameraLayersCount: Math.max(0, layers.filter(l => l.type === 'camera').length - 1)
      });

      if (layer.mediaElement instanceof HTMLVideoElement) {
        layer.mediaElement.srcObject = camRes.stream;
        await layer.mediaElement.play().catch(() => {});
        studioAudio.attachMediaStream(layer.id, camRes.stream, layer.volume, layer.muted);
      }

      setLayers(prev => prev.map(l => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          name: camRes.isMock 
            ? (nextFacing === 'environment' ? 'Rear Camera (Simulated)' : 'Front Camera (Simulated)')
            : (nextFacing === 'environment' ? 'Back Camera (Rear)' : 'Front Camera (Selfie)'),
          facingMode: nextFacing,
          mirrored: nextFacing === 'user',
          stream: camRes.stream,
          deviceId: camRes.deviceId,
          isMockSource: camRes.isMock
        };
      }));
      logTimelineEvent('camera_switch', layerId, `Camera flipped to ${nextFacing === 'environment' ? 'Rear / Back' : 'Front / Selfie'}`);
    } catch (e) {
      alert(`Camera switch failed: ${(e as Error).message}`);
    }
  };

  // Camera Hardware Device Selection
  const handleSelectCameraDevice = async (layerId: string, deviceId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.type !== 'camera') return;

    if (layer.stream) {
      layer.stream.getTracks().forEach(t => t.stop());
    }

    try {
      const camRes = await requestCameraStream({
        deviceId,
        existingCameraLayersCount: Math.max(0, layers.filter(l => l.type === 'camera').length - 1)
      });

      if (layer.mediaElement instanceof HTMLVideoElement) {
        layer.mediaElement.srcObject = camRes.stream;
        await layer.mediaElement.play().catch(() => {});
        studioAudio.attachMediaStream(layer.id, camRes.stream, layer.volume, layer.muted);
      }

      setLayers(prev => prev.map(l => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          stream: camRes.stream,
          deviceId: camRes.deviceId,
          facingMode: camRes.facingMode,
          mirrored: camRes.facingMode === 'user',
          isMockSource: camRes.isMock
        };
      }));
    } catch (e) {
      alert(`Camera device select failed: ${(e as Error).message}`);
    }
  };

  // Reorder layers (Z-Index)
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newLayers = [...prev];
      const [moved] = newLayers.splice(idx, 1);
      newLayers.splice(targetIdx, 0, moved);
      logTimelineEvent('layer_reorder', moved.id, moved.name, { direction, newIndex: targetIdx });
      return newLayers;
    });
  };

  // Duplicate layer
  const handleDuplicateLayer = (id: string) => {
    const original = layers.find(l => l.id === id);
    if (!original) return;

    const newId = `layer-${Date.now()}`;
    const duplicated: StudioLayer = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      geometry: {
        ...original.geometry,
        x: Math.min(0.9 - original.geometry.w, original.geometry.x + 0.04),
        y: Math.min(0.9 - original.geometry.h, original.geometry.y + 0.04)
      }
    };

    setLayers(prev => [...prev, duplicated]);
    setSelectedLayerId(newId);
    logTimelineEvent('layer_add', newId, duplicated.name);
  };

  // Delete layer
  const handleDeleteLayer = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    // Teardown tracks & audio
    if (layer.stream) {
      layer.stream.getTracks().forEach(t => t.stop());
    }
    if (layer.mediaElement instanceof HTMLVideoElement) {
      layer.mediaElement.pause();
      layer.mediaElement.src = '';
    }
    studioAudio.detachLayer(id);

    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
    logTimelineEvent('layer_remove', layer.id, layer.name);
  };

  // Apply one of the 14 Layout Presets
  const handleApplyPreset = (presetId: string) => {
    if (!selectedLayerId) return;
    const preset = STUDIO_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setLayers(prev => prev.map(l => {
      if (l.id === selectedLayerId) {
        const newGeom = preset.getGeometry(aspectRatio, l.sourceAspectRatio);
        logTimelineEvent('geometry_change', l.id, l.name, { preset: preset.name });
        return { ...l, geometry: newGeom };
      }
      return l;
    }));
  };

  // Add Local Video File
  const handleAddLocalVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.src = url;
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.loop = true;

    const newId = `layer-${Date.now()}`;
    const newLayer: StudioLayer = {
      id: newId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'video',
      visible: true,
      locked: false,
      muted: false,
      volume: 1.0,
      playing: true,
      geometry: { x: 0.1, y: 0.1, w: 0.45, h: 0.45 },
      fitMode: 'cover',
      aspectLocked: true,
      sourceAspectRatio: 16 / 9,
      cornerRadius: 8,
      borderWidth: 1,
      borderColor: '#38bdf8',
      opacity: 1.0,
      sourceUrl: url,
      fileName: file.name,
      mediaElement: videoEl,
      currentTime: 0,
      duration: 60
    };

    videoEl.play().catch(() => {});
    studioAudio.attachMediaElement(newId, videoEl, 1.0, false);

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newId);
    logTimelineEvent('layer_add', newId, newLayer.name);
  };

  // Add Built-in Sample Video
  const handleAddSampleVideo = (sampleUrl: string, name: string) => {
    const videoEl = document.createElement('video');
    videoEl.src = sampleUrl;
    videoEl.crossOrigin = 'anonymous';
    videoEl.playsInline = true;
    videoEl.autoplay = true;
    videoEl.loop = true;

    const newId = `layer-${Date.now()}`;
    const newLayer: StudioLayer = {
      id: newId,
      name,
      type: 'video',
      visible: true,
      locked: false,
      muted: false,
      volume: 1.0,
      playing: true,
      geometry: { x: 0.2, y: 0.2, w: 0.5, h: 0.5 },
      fitMode: 'cover',
      aspectLocked: true,
      sourceAspectRatio: 16 / 9,
      cornerRadius: 10,
      borderWidth: 2,
      borderColor: '#38bdf8',
      opacity: 1.0,
      sourceUrl: sampleUrl,
      mediaElement: videoEl,
      currentTime: 0,
      duration: 30
    };

    videoEl.play().catch(() => {});
    studioAudio.attachMediaElement(newId, videoEl, 1.0, false);

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newId);
    logTimelineEvent('layer_add', newId, name);
  };

  // Add Live Camera Feed
  const handleAddCamera = async (facing: 'user' | 'environment' = 'user') => {
    const existingCamsCount = layers.filter(l => l.type === 'camera').length;

    try {
      const camRes = await requestCameraStream({
        facingMode: facing,
        existingCameraLayersCount: existingCamsCount
      });

      const videoEl = document.createElement('video');
      videoEl.srcObject = camRes.stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.play().catch(() => {});

      const newId = `layer-cam-${Date.now()}`;
      studioAudio.attachMediaStream(newId, camRes.stream, 1.0, false);

      const newLayer: StudioLayer = {
        id: newId,
        name: camRes.isMock ? `Simulated Camera ${existingCamsCount + 1}` : `Camera ${existingCamsCount + 1}`,
        type: 'camera',
        visible: true,
        locked: false,
        muted: false,
        volume: 1.0,
        playing: true,
        geometry: { x: 0.04, y: 0.68, w: 0.28, h: 0.28 },
        fitMode: 'cover',
        aspectLocked: true,
        sourceAspectRatio: 4 / 3,
        cornerRadius: 12,
        borderWidth: 2,
        borderColor: '#38bdf8',
        opacity: 1.0,
        mirrored: facing === 'user',
        mediaElement: videoEl,
        stream: camRes.stream,
        isMockSource: camRes.isMock,
        currentTime: 0,
        duration: 0
      };

      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newId);
      logTimelineEvent('layer_add', newId, newLayer.name);
    } catch (e: unknown) {
      alert((e as Error).message || 'Could not access camera feed.');
    }
  };

  // Add Screen Share Feed
  const handleAddScreenShare = async () => {
    try {
      const screenRes = await requestScreenStream();
      const videoEl = document.createElement('video');
      videoEl.srcObject = screenRes.stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.play().catch(() => {});

      const newId = `layer-screen-${Date.now()}`;
      studioAudio.attachMediaStream(newId, screenRes.stream, 1.0, false);

      const newLayer: StudioLayer = {
        id: newId,
        name: 'Screen Share Commentary',
        type: 'screen',
        visible: true,
        locked: false,
        muted: false,
        volume: 1.0,
        playing: true,
        geometry: { x: 0.05, y: 0.05, w: 0.90, h: 0.90 },
        fitMode: 'contain',
        aspectLocked: true,
        sourceAspectRatio: 16 / 9,
        cornerRadius: 6,
        borderWidth: 1,
        borderColor: '#10b981',
        opacity: 1.0,
        mediaElement: videoEl,
        stream: screenRes.stream,
        currentTime: 0,
        duration: 0
      };

      // Place screen share under existing PiP layers
      setLayers(prev => [newLayer, ...prev]);
      setSelectedLayerId(newId);
      logTimelineEvent('layer_add', newId, newLayer.name);
    } catch (e: unknown) {
      alert((e as Error).message || 'Screen sharing not available.');
    }
  };

  // Add Image Overlay
  const handleAddImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const imgEl = new Image();
    imgEl.src = url;

    const newId = `layer-img-${Date.now()}`;
    const newLayer: StudioLayer = {
      id: newId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'image',
      visible: true,
      locked: false,
      muted: true,
      volume: 0,
      playing: false,
      geometry: { x: 0.05, y: 0.05, w: 0.20, h: 0.15 },
      fitMode: 'contain',
      aspectLocked: true,
      cornerRadius: 4,
      borderWidth: 0,
      borderColor: '#ffffff',
      opacity: 0.9,
      sourceUrl: url,
      fileName: file.name,
      mediaElement: imgEl,
      currentTime: 0,
      duration: 0
    };

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newId);
    logTimelineEvent('layer_add', newId, newLayer.name);
  };

  // Play All
  const handlePlayAll = () => {
    setIsPlayingAll(true);
    layers.forEach(l => {
      if (l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.play().catch(() => {});
      }
    });
    setLayers(prev => prev.map(l => ({ ...l, playing: true })));
    logTimelineEvent('play', 'all', 'All Layers');
  };

  // Pause All
  const handlePauseAll = () => {
    setIsPlayingAll(false);
    layers.forEach(l => {
      if (l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.pause();
      }
    });
    setLayers(prev => prev.map(l => ({ ...l, playing: false })));
    logTimelineEvent('pause', 'all', 'All Layers');
  };

  // Reset All
  const handleResetAll = () => {
    layers.forEach(l => {
      if (l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.currentTime = 0;
      }
    });
    setCurrentTime(0);
    logTimelineEvent('seek', 'all', 'All Layers', { time: 0 });
  };

  // Seek All
  const handleSeek = (time: number) => {
    layers.forEach(l => {
      if (l.mediaElement instanceof HTMLVideoElement) {
        l.mediaElement.currentTime = time;
      }
    });
    setCurrentTime(time);
    logTimelineEvent('seek', 'all', 'All Layers', { time });
  };

  // Recording Pipeline: Countdown -> Start Recording
  const handleStartRecording = () => {
    studioAudio.resume();
    let count = 3;
    setCountdownNumber(count);

    countdownTimerRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdownNumber(null);
        startMediaRecorder();
      } else {
        setCountdownNumber(count);
      }
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownNumber(null);
  };

  const startMediaRecorder = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // 1. Playback synchronization: Handle auto-rewind on record start
      if (recordQualityConfig.autoRewindOnRecord) {
        layers.forEach(l => {
          if (l.type === 'video' && l.mediaElement instanceof HTMLVideoElement) {
            l.mediaElement.currentTime = 0;
            l.mediaElement.play().catch(() => {});
          }
        });
        setCurrentTime(0);
        setIsPlayingAll(true);
        setLayers(prev => prev.map(l => l.type === 'video' ? { ...l, currentTime: 0, playing: true } : l));
        logTimelineEvent('record_start', 'all', 'Auto-rewound video layers to start for take');
      } else {
        // Keep current playback position; start playback if paused
        layers.forEach(l => {
          if (l.type === 'video' && l.mediaElement instanceof HTMLVideoElement) {
            l.mediaElement.play().catch(() => {});
          }
        });
        setIsPlayingAll(true);
        setLayers(prev => prev.map(l => l.type === 'video' ? { ...l, playing: true } : l));
      }

      // 2. Stream Capture with user-configured FPS
      const canvasStream = canvas.captureStream(recordQualityConfig.targetFps);
      const audioStream = studioAudio.getRecordDestinationStream();

      // Combine video track + mixed audio track
      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedTracks.push(audioStream.getAudioTracks()[0]);
      }

      const recordStream = new MediaStream(combinedTracks);

      // 3. Codec & Bitrate Negotiation
      const candidateMimes = [
        recordQualityConfig.preferredMimeType,
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm'
      ];
      let selectedMime = 'video/webm';
      for (const m of candidateMimes) {
        if (m && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(recordStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: recordQualityConfig.videoBitrate,
        audioBitsPerSecond: recordQualityConfig.audioBitrate
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
        const blobUrl = URL.createObjectURL(blob);
        const takeName = `Take ${takes.length + 1} (${aspectRatio})`;

        const newTake: RecordingTake = {
          id: `take-${Date.now()}`,
          name: takeName,
          timestamp: new Date().toLocaleTimeString(),
          durationMs: recordingSeconds * 1000,
          blobUrl,
          blobSize: blob.size,
          mimeType: selectedMime,
          canvasAspect: aspectRatio
        };

        setTakes(prev => [...prev, newTake]);
        setSelectedTake(newTake);
        setIsTakesModalOpen(true);
        setIsRecording(false);
      };

      recorder.start(1000); // 1-second timeslices
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert(`Recording error: ${(err as Error).message}`);
    }
  };

  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDeleteTake = (takeId: string) => {
    const take = takes.find(t => t.id === takeId);
    if (take) {
      URL.revokeObjectURL(take.blobUrl);
    }
    const remaining = takes.filter(t => t.id !== takeId);
    setTakes(remaining);
    setSelectedTake(remaining[remaining.length - 1] || null);
    if (remaining.length === 0) {
      setIsTakesModalOpen(false);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  // Active video layer for transport controls (selected video, or primary video in project)
  const activeVideoLayer = (selectedLayer && selectedLayer.type === 'video')
    ? selectedLayer
    : (layers.find(l => l.type === 'video') || null);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Top Header */}
      <Header
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        zoomMode={zoomMode}
        onZoomModeChange={setZoomMode}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        onStartRecord={handleStartRecording}
        onStopRecord={handleStopRecording}
        onOpenDeploymentModal={() => setIsDeploymentModalOpen(true)}
        onOpenDiagnosticsModal={() => setIsDiagnosticsModalOpen(true)}
        isMobile={isMobile}
        takesCount={takes.length}
        onOpenTakesModal={() => setIsTakesModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        qualityPresetLabel={recordQualityConfig.resolutionPreset}
      />

      {/* Main Studio Body: Responsive Multi-Panel Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Layer Stack (Hidden on mobile if tab is not 'layers') */}
        <div className={`w-72 shrink-0 h-full border-r border-slate-800 ${
          isMobile ? (mobileActiveTab === 'layers' ? 'w-full absolute inset-0 z-40 bg-slate-900' : 'hidden') : 'block'
        }`}>
          <LayerList
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => {
              setSelectedLayerId(id);
              if (isMobile) setMobileActiveTab('canvas');
            }}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
            onTogglePlayPause={handleTogglePlayPause}
            onDuplicateLayer={handleDuplicateLayer}
            onDeleteLayer={handleDeleteLayer}
            onMoveLayer={handleMoveLayer}
            onAddLocalVideo={handleAddLocalVideo}
            onAddSampleVideo={handleAddSampleVideo}
            onAddCamera={handleAddCamera}
            onSwitchCameraFacing={handleSwitchCameraFacing}
            onAddScreenShare={handleAddScreenShare}
            onAddImage={handleAddImage}
            isMobile={isMobile}
          />
        </div>

        {/* Center: Canvas Compositor Stage & Timeline Scrubber */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
          {/* Canvas Viewport */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <CanvasStage
              aspectRatio={aspectRatio}
              zoomMode={zoomMode}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayerGeometry={handleUpdateLayerGeometry}
              snapEnabled={snapEnabled}
              canvasRef={canvasRef}
              isMobile={isMobile}
            />
          </div>

          {/* Local Video Scrubber & Transport Bar (Visible when a video layer exists) */}
          {activeVideoLayer && (
            <div className="shrink-0">
              <LocalVideoControlBar
                layer={activeVideoLayer}
                onSeek={(time) => handleVideoSeek(activeVideoLayer.id, time)}
                onTogglePlayPause={() => handleTogglePlayPause(activeVideoLayer.id)}
                onSkip={(delta) => handleVideoSkip(activeVideoLayer.id, delta)}
                onSetSpeed={(speed) => handleVideoSetSpeed(activeVideoLayer.id, speed)}
                onToggleLoop={() => handleVideoToggleLoop(activeVideoLayer.id)}
                autoRewindOnRecord={recordQualityConfig.autoRewindOnRecord}
                onToggleAutoRewind={() => setRecordQualityConfig(prev => ({ ...prev, autoRewindOnRecord: !prev.autoRewindOnRecord }))}
              />
            </div>
          )}

          {/* Timeline & Scrubber Strip */}
          <div className="shrink-0">
            <TimelineScrubber
              currentTime={currentTime}
              duration={duration}
              isPlayingAll={isPlayingAll}
              onPlayAll={handlePlayAll}
              onPauseAll={handlePauseAll}
              onResetAll={handleResetAll}
              onSeek={handleSeek}
              events={events}
            />
          </div>

          {/* Master Audio Mixer Strip (Desktop) */}
          <div className="shrink-0 hidden md:block">
            <AudioMixer
              layers={layers}
              masterVolume={masterVolume}
              onMasterVolumeChange={handleMasterVolumeChange}
              onLayerVolumeChange={handleVolumeChange}
              onLayerToggleMute={handleToggleMute}
            />
          </div>
        </div>

        {/* Right Sidebar: Layer Inspector & 14 Layout Presets (Hidden on mobile if tab is not 'inspector') */}
        <div className={`w-80 shrink-0 h-full border-l border-slate-800 ${
          isMobile ? (mobileActiveTab === 'inspector' ? 'w-full absolute inset-0 z-40 bg-slate-900' : 'hidden') : 'block'
        }`}>
          <LayerInspector
            layer={selectedLayer}
            aspectRatio={aspectRatio}
            onUpdateGeometry={(geom) => {
              if (selectedLayerId) handleUpdateLayerGeometry(selectedLayerId, geom);
            }}
            onUpdateLayerProp={handleUpdateLayerProp}
            onApplyPreset={handleApplyPreset}
            onSwitchCameraFacing={handleSwitchCameraFacing}
            onSelectCameraDevice={handleSelectCameraDevice}
            onVideoSeek={handleVideoSeek}
            onVideoSkip={handleVideoSkip}
            onVideoSetSpeed={handleVideoSetSpeed}
            onVideoToggleLoop={handleVideoToggleLoop}
            autoRewindOnRecord={recordQualityConfig.autoRewindOnRecord}
            onToggleAutoRewind={() => setRecordQualityConfig(prev => ({ ...prev, autoRewindOnRecord: !prev.autoRewindOnRecord }))}
          />
        </div>

        {/* Mobile-Only Audio Tab Drawer */}
        {isMobile && mobileActiveTab === 'audio' && (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Web Audio Mixer &amp; Channels</span>
              </h3>
              <button
                type="button"
                onClick={() => setMobileActiveTab('canvas')}
                className="text-xs px-2.5 py-1 bg-slate-800 rounded text-slate-300"
              >
                Back to Canvas
              </button>
            </div>
            <AudioMixer
              layers={layers}
              masterVolume={masterVolume}
              onMasterVolumeChange={handleMasterVolumeChange}
              onLayerVolumeChange={handleVolumeChange}
              onLayerToggleMute={handleToggleMute}
            />
          </div>
        )}
      </div>

      {/* Mobile Navigation Dock (Visible on small screens) */}
      <div className="md:hidden bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around z-30 shrink-0 text-[10px] font-semibold text-slate-400">
        <button
          type="button"
          onClick={() => setMobileActiveTab('canvas')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-md transition-colors ${
            mobileActiveTab === 'canvas' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('layers')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-md transition-colors ${
            mobileActiveTab === 'layers' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layers ({layers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('inspector')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-md transition-colors ${
            mobileActiveTab === 'inspector' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Presets &amp; PiP</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('audio')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-md transition-colors ${
            mobileActiveTab === 'audio' ? 'text-sky-400' : 'hover:text-slate-200'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Audio Mix</span>
        </button>
      </div>

      {/* Recording Countdown & Takes Review Modal */}
      <RecordingModal
        countdownNumber={countdownNumber}
        onCancelCountdown={handleCancelCountdown}
        takes={takes}
        selectedTake={selectedTake}
        onSelectTake={setSelectedTake}
        onDeleteTake={handleDeleteTake}
        isOpen={isTakesModalOpen}
        onClose={() => setIsTakesModalOpen(false)}
      />

      {/* Recording Quality & Export Configuration Modal */}
      <ExportQualityModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={recordQualityConfig}
        onChangeConfig={setRecordQualityConfig}
        currentCanvasAspect={aspectRatio}
      />

      {/* Windows & Termux Local Run Guide Modal */}
      <DeploymentModal
        isOpen={isDeploymentModalOpen}
        onClose={() => setIsDeploymentModalOpen(false)}
      />

      {/* Hardware & Browser Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
        renderFps={renderFps}
      />
    </div>
  );
}
