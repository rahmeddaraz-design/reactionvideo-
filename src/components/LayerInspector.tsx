import React, { useEffect, useState } from 'react';
import { 
  StudioLayer, 
  CanvasAspectRatio, 
  NormalizedGeometry, 
  LayerFitMode 
} from '../types';
import { STUDIO_PRESETS } from '../utils/presets';
import { enumerateCameras, CameraDeviceInfo } from '../utils/camera';
import { 
  Sliders, 
  Lock, 
  Unlock, 
  FlipHorizontal, 
  Maximize2, 
  Crop, 
  Grid2X2, 
  Layers,
  Sparkles,
  Camera,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  Repeat,
  Gauge,
  Clock,
  Film
} from 'lucide-react';

interface LayerInspectorProps {
  layer: StudioLayer | null;
  aspectRatio: CanvasAspectRatio;
  onUpdateGeometry: (geom: NormalizedGeometry) => void;
  onUpdateLayerProp: <K extends keyof StudioLayer>(key: K, value: StudioLayer[K]) => void;
  onApplyPreset: (presetId: string) => void;
  onSwitchCameraFacing?: (layerId: string) => void;
  onSelectCameraDevice?: (layerId: string, deviceId: string) => void;
  onVideoSeek?: (layerId: string, time: number) => void;
  onVideoSkip?: (layerId: string, delta: number) => void;
  onVideoTogglePlay?: (layerId: string) => void;
  onVideoSetSpeed?: (layerId: string, speed: number) => void;
  onVideoToggleLoop?: (layerId: string) => void;
}

const BORDER_COLORS = [
  '#38bdf8', // Sky
  '#ffffff', // White
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#64748b'  // Slate
];

export const LayerInspector: React.FC<LayerInspectorProps> = ({
  layer,
  aspectRatio,
  onUpdateGeometry,
  onUpdateLayerProp,
  onApplyPreset,
  onSwitchCameraFacing,
  onSelectCameraDevice,
  onVideoSeek,
  onVideoSkip,
  onVideoTogglePlay,
  onVideoSetSpeed,
  onVideoToggleLoop
}) => {
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);

  useEffect(() => {
    if (layer?.type === 'camera') {
      enumerateCameras().then(setAvailableCameras);
    }
  }, [layer?.type]);

  if (!layer) {
    return (
      <div className="h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <Sliders className="w-8 h-8 mb-2 stroke-1 opacity-50 text-slate-400" />
        <p className="text-xs font-semibold text-slate-400">No Layer Selected</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
          Click on any layer on the canvas or in the layer list to inspect and edit its position, presets, and appearance.
        </p>
      </div>
    );
  }

  const { geometry } = layer;

  const handleCoordChange = (key: keyof NormalizedGeometry, val: number) => {
    const clamped = Math.max(0, Math.min(1.0, val));
    const newGeom = { ...geometry, [key]: clamped };
    onUpdateGeometry(newGeom);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="h-full bg-slate-900 border-l border-slate-800 overflow-y-auto p-3 text-slate-200 select-none space-y-4 scrollbar-thin scrollbar-thumb-slate-700 text-xs">
      {/* Title & Rename */}
      <div className="border-b border-slate-800 pb-2.5">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
            Layer Properties
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-400 uppercase">
            {layer.type}
          </span>
        </div>
        <input
          type="text"
          value={layer.name}
          onChange={(e) => onUpdateLayerProp('name', e.target.value)}
          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-md font-semibold text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
          placeholder="Layer Name"
        />
      </div>

      {/* CAMERA SPECIFIC CONTROLS: FRONT / BACK SWITCH & DEVICE PICKER */}
      {layer.type === 'camera' && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Camera Sensor Controls</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
              {layer.facingMode === 'environment' ? 'Rear / World' : 'Front / Selfie'}
            </span>
          </div>

          {/* Switch Front ⇋ Back Button */}
          <button
            type="button"
            onClick={() => onSwitchCameraFacing && onSwitchCameraFacing(layer.id)}
            className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-900/30 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Switch Camera ({layer.facingMode === 'environment' ? 'Back ➔ Front' : 'Front ➔ Back'})</span>
          </button>

          {/* Camera Device Dropdown */}
          {availableCameras.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-medium">Select Hardware Camera:</label>
              <select
                value={layer.deviceId || ''}
                onChange={(e) => onSelectCameraDevice && onSelectCameraDevice(layer.id, e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="">Auto Lens Select ({layer.facingMode || 'user'})</option>
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mirror / Flip for Selfie */}
          <button
            type="button"
            onClick={() => onUpdateLayerProp('mirrored', !layer.mirrored)}
            className={`w-full py-1.5 px-2 rounded-md border flex items-center justify-center gap-1.5 text-xs transition-colors ${
              layer.mirrored
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Selfie Mirror: {layer.mirrored ? 'Enabled (Natural)' : 'Disabled'}</span>
          </button>
        </div>
      )}

      {/* VIDEO LAYER SPECIFIC CONTROLS: FORWARD / BACK SCRUBBER & SPEED */}
      {layer.type === 'video' && (
        <div className="bg-slate-950 p-3 rounded-lg border border-sky-950/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-sky-400" />
              <span>Video Playback &amp; Seek</span>
            </span>
            <div className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {formatTime(layer.currentTime || 0)} / {formatTime(layer.duration || 60)}
            </div>
          </div>

          {/* Local Video Scrubber Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={layer.duration || 60}
              step="0.1"
              value={layer.currentTime || 0}
              onChange={(e) => onVideoSeek && onVideoSeek(layer.id, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>00:00.0</span>
              <span>{formatTime(layer.duration || 60)}</span>
            </div>
          </div>

          {/* Transport Buttons: Start, -10s, -5s, Play/Pause, +5s, +10s */}
          <div className="grid grid-cols-6 gap-1">
            <button
              type="button"
              onClick={() => onVideoSeek && onVideoSeek(layer.id, 0)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold flex flex-col items-center justify-center"
              title="Rewind to start 00:00"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[8px] mt-0.5">00:00</span>
            </button>

            <button
              type="button"
              onClick={() => onVideoSkip && onVideoSkip(layer.id, -10)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold flex flex-col items-center justify-center"
              title="Skip back 10 seconds"
            >
              <Rewind className="w-3 h-3" />
              <span className="text-[8px] mt-0.5">-10s</span>
            </button>

            <button
              type="button"
              onClick={() => onVideoSkip && onVideoSkip(layer.id, -5)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold flex flex-col items-center justify-center"
              title="Skip back 5 seconds"
            >
              <Rewind className="w-3 h-3" />
              <span className="text-[8px] mt-0.5">-5s</span>
            </button>

            <button
              type="button"
              onClick={() => onVideoTogglePlay && onVideoTogglePlay(layer.id)}
              className={`p-1.5 rounded text-[10px] font-bold flex flex-col items-center justify-center transition-colors ${
                layer.playing ? 'bg-amber-600 text-white' : 'bg-sky-600 text-white'
              }`}
              title={layer.playing ? 'Pause' : 'Play'}
            >
              {layer.playing ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span className="text-[8px] mt-0.5">{layer.playing ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={() => onVideoSkip && onVideoSkip(layer.id, 5)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold flex flex-col items-center justify-center"
              title="Skip forward 5 seconds"
            >
              <FastForward className="w-3 h-3" />
              <span className="text-[8px] mt-0.5">+5s</span>
            </button>

            <button
              type="button"
              onClick={() => onVideoSkip && onVideoSkip(layer.id, 10)}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-bold flex flex-col items-center justify-center"
              title="Skip forward 10 seconds"
            >
              <FastForward className="w-3 h-3" />
              <span className="text-[8px] mt-0.5">+10s</span>
            </button>
          </div>

          {/* Speed & Loop */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-400">Speed:</span>
              <select
                value={layer.playbackRate || 1.0}
                onChange={(e) => onVideoSetSpeed && onVideoSetSpeed(layer.id, parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onVideoToggleLoop && onVideoToggleLoop(layer.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                (layer.loop ?? true)
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Repeat className="w-2.5 h-2.5" />
              <span>Loop: {(layer.loop ?? true) ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 14 Quick Layout Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Layout Presets</span>
          </label>
          <span className="text-[10px] text-slate-400">14 styles</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {STUDIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className="px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/70 hover:border-sky-500/60 rounded-md text-[11px] font-medium text-slate-300 hover:text-white transition-all text-left flex items-center justify-between group active:scale-98"
              title={preset.description}
            >
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transform Geometry (X, Y, Width, Height) */}
      <div className="border-t border-slate-800 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Transform Coordinates
          </label>
          <button
            type="button"
            onClick={() => onUpdateLayerProp('aspectLocked', !layer.aspectLocked)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
              layer.aspectLocked 
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' 
                : 'text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Lock width and height aspect ratio"
          >
            {layer.aspectLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            <span>Ratio Lock</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* X Pos */}
          <div className="bg-slate-800/60 p-2 rounded-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>X (Left)</span>
              <span className="font-mono text-slate-200">{Math.round(geometry.x * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={1.0 - geometry.w}
              step="0.01"
              value={geometry.x}
              onChange={(e) => handleCoordChange('x', parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Y Pos */}
          <div className="bg-slate-800/60 p-2 rounded-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Y (Top)</span>
              <span className="font-mono text-slate-200">{Math.round(geometry.y * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={1.0 - geometry.h}
              step="0.01"
              value={geometry.y}
              onChange={(e) => handleCoordChange('y', parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Width */}
          <div className="bg-slate-800/60 p-2 rounded-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Width</span>
              <span className="font-mono text-slate-200">{Math.round(geometry.w * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="1.0"
              step="0.01"
              value={geometry.w}
              onChange={(e) => handleCoordChange('w', parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Height */}
          <div className="bg-slate-800/60 p-2 rounded-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Height</span>
              <span className="font-mono text-slate-200">{Math.round(geometry.h * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="1.0"
              step="0.01"
              value={geometry.h}
              onChange={(e) => handleCoordChange('h', parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>
      </div>

      {/* Media Fit & Orientation */}
      <div className="border-t border-slate-800 pt-3 space-y-2">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Fit Mode &amp; Sizing
        </label>

        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-md border border-slate-700/60">
          {(['cover', 'contain', 'stretch'] as LayerFitMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onUpdateLayerProp('fitMode', mode)}
              className={`flex-1 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                layer.fitMode === mode
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance: Corner Radius, Border, Opacity */}
      <div className="border-t border-slate-800 pt-3 space-y-3">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Style &amp; Appearance
        </label>

        {/* Corner Radius */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Corner Radius</span>
            <span className="font-mono text-slate-200">{layer.cornerRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="48"
            step="2"
            value={layer.cornerRadius}
            onChange={(e) => onUpdateLayerProp('cornerRadius', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Border Width & Color */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Border Width</span>
            <span className="font-mono text-slate-200">{layer.borderWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={layer.borderWidth}
            onChange={(e) => onUpdateLayerProp('borderWidth', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
          />

          {layer.borderWidth > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {BORDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdateLayerProp('borderColor', color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    layer.borderColor === color ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Opacity</span>
            <span className="font-mono text-slate-200">{Math.round(layer.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={layer.opacity}
            onChange={(e) => onUpdateLayerProp('opacity', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>
    </div>
  );
};
