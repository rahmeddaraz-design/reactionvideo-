import React from 'react';
import { 
  Video, 
  Circle, 
  Square, 
  Settings, 
  Activity, 
  Smartphone, 
  Monitor, 
  Maximize2,
  Magnet,
  FolderDown,
  Sliders
} from 'lucide-react';
import { CanvasAspectRatio } from '../types';

interface HeaderProps {
  aspectRatio: CanvasAspectRatio;
  onAspectRatioChange: (aspect: CanvasAspectRatio) => void;
  zoomMode: 'fit' | 'fill' | '100%' | '75%';
  onZoomModeChange: (mode: 'fit' | 'fill' | '100%' | '75%') => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onOpenDeploymentModal: () => void;
  onOpenDiagnosticsModal: () => void;
  isMobile: boolean;
  takesCount: number;
  onOpenTakesModal: () => void;
  onOpenExportModal: () => void;
  qualityPresetLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  aspectRatio,
  onAspectRatioChange,
  zoomMode,
  onZoomModeChange,
  snapEnabled,
  onToggleSnap,
  isRecording,
  recordingSeconds,
  onStartRecord,
  onStopRecord,
  onOpenDeploymentModal,
  onOpenDiagnosticsModal,
  isMobile,
  takesCount,
  onOpenTakesModal,
  onOpenExportModal,
  qualityPresetLabel = '1080p'
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 select-none z-30 sticky top-0">
      {/* Brand & Platform Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
          <Video className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100 truncate tracking-tight">
              Ahmed Reaction Studio
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {isMobile ? <Smartphone className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
              {isMobile ? 'Mobile/Termux' : 'Windows/Desktop'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate hidden md:block">
            Local Multi-PiP Compositor &bull; Zero Cloud
          </p>
        </div>
      </div>

      {/* Center Controls: Aspect Ratio & Canvas Zoom Sizing */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
          <button
            type="button"
            title="16:9 Landscape (Desktop & YouTube)"
            onClick={() => onAspectRatioChange('16:9')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              aspectRatio === '16:9'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span className="hidden sm:inline">16:9</span>
            <span className="sm:hidden">Wide</span>
          </button>
          <button
            type="button"
            title="9:16 Portrait (Mobile Reels & TikTok)"
            onClick={() => onAspectRatioChange('9:16')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              aspectRatio === '9:16'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span className="hidden sm:inline">9:16</span>
            <span className="sm:hidden">Tall</span>
          </button>
          <button
            type="button"
            title="1:1 Square (Instagram & Feed)"
            onClick={() => onAspectRatioChange('1:1')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              aspectRatio === '1:1'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>1:1</span>
          </button>
        </div>

        {/* View Size Mode */}
        <div className="hidden lg:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => onZoomModeChange('fit')}
            className={`px-2 py-1 rounded-md transition-all ${
              zoomMode === 'fit' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Fit canvas to screen size"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => onZoomModeChange('fill')}
            className={`px-2 py-1 rounded-md transition-all ${
              zoomMode === 'fill' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Fill available screen"
          >
            Fill
          </button>
          <button
            type="button"
            onClick={() => onZoomModeChange('100%')}
            className={`px-2 py-1 rounded-md transition-all ${
              zoomMode === '100%' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="100% 1:1 Scale"
          >
            100%
          </button>
        </div>

        {/* Snapping Toggle */}
        <button
          type="button"
          onClick={onToggleSnap}
          title={snapEnabled ? 'Snap to edges & center ON' : 'Snapping OFF'}
          className={`hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-all ${
            snapEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Snap</span>
        </button>
      </div>

      {/* Right Side: Recording & Modals */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Saved Takes Button */}
        {takesCount > 0 && (
          <button
            type="button"
            onClick={onOpenTakesModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            title="View recorded takes"
          >
            <FolderDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Takes ({takesCount})</span>
          </button>
        )}

        {/* Termux & Windows Setup Guide */}
        <button
          type="button"
          onClick={onOpenDeploymentModal}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-medium transition-all"
          title="Windows & Termux Local Run Instructions"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline">Termux / Windows</span>
        </button>

        {/* Quality & Export Settings */}
        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-semibold transition-all"
          title="Recording Quality, Resolution, FPS, Bitrate & Export Settings"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline font-mono uppercase text-[11px] text-sky-300">{qualityPresetLabel}</span>
        </button>

        {/* System Diagnostics */}
        <button
          type="button"
          onClick={onOpenDiagnosticsModal}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all"
          title="System & Browser Hardware Diagnostics"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Record Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={onStartRecord}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
            <span>REC</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopRecord}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-500 font-semibold text-xs tracking-wide transition-all animate-pulse active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>{formatTime(recordingSeconds)}</span>
          </button>
        )}
      </div>
    </header>
  );
};
