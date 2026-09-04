import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Rewind, 
  Repeat, 
  Gauge, 
  Clock, 
  Film,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { StudioLayer } from '../types';

interface LocalVideoControlBarProps {
  layer: StudioLayer | null;
  onSeek: (time: number) => void;
  onTogglePlayPause: () => void;
  onSkip: (secondsDelta: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  autoRewindOnRecord: boolean;
  onToggleAutoRewind: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const LocalVideoControlBar: React.FC<LocalVideoControlBarProps> = ({
  layer,
  onSeek,
  onTogglePlayPause,
  onSkip,
  onSetSpeed,
  onToggleLoop,
  autoRewindOnRecord,
  onToggleAutoRewind
}) => {
  if (!layer || layer.type !== 'video') {
    return null;
  }

  const duration = layer.duration || 1;
  const currentTime = layer.currentTime || 0;
  const isPlaying = layer.playing;
  const playbackRate = layer.playbackRate || 1.0;
  const isLooping = layer.loop ?? true;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className="bg-slate-900 border-t border-sky-900/40 px-3 py-2 text-slate-200 select-none shadow-inner">
      {/* Title & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-bold">
            <Film className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{layer.name}</span>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-1 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <Clock className="w-3 h-3 text-sky-400" />
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right tools: Auto-Rewind on REC & Speed & Loop */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Auto-rewind on REC Toggle */}
          <button
            type="button"
            onClick={onToggleAutoRewind}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              autoRewindOnRecord
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="When active, starting a recording rewinds videos to 00:00 automatically"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Rewind on REC: {autoRewindOnRecord ? 'ON' : 'OFF'}</span>
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              isLooping
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle video loop playback"
          >
            <Repeat className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Loop</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[11px]">
            <Gauge className="w-3 h-3 text-amber-400" />
            <select
              value={playbackRate}
              onChange={(e) => onSetSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed} className="bg-slate-800 text-slate-200">
                  {speed}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scrubber Track */}
      <div 
        className="relative h-3 bg-slate-950 rounded border border-slate-800 cursor-pointer overflow-hidden group mb-1.5"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(pct * duration);
        }}
      >
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-l transition-all pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scrubber Playhead */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-white shadow-md transform -translate-x-1/2 pointer-events-none rounded-full"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Button Transport Controls: -10s, -5s, Play, +5s, +10s, Reset */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {/* Rewind to 0 */}
          <button
            type="button"
            onClick={() => onSeek(0)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Rewind video to 00:00"
          >
            <SkipBack className="w-3 h-3" />
            <span>Start</span>
          </button>

          {/* -10s */}
          <button
            type="button"
            onClick={() => onSkip(-10)}
            className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Step back 10 seconds"
          >
            <Rewind className="w-3 h-3" />
            <span>-10s</span>
          </button>

          {/* -5s */}
          <button
            type="button"
            onClick={() => onSkip(-5)}
            className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Step back 5 seconds"
          >
            <Rewind className="w-3 h-3" />
            <span>-5s</span>
          </button>
        </div>

        {/* Big Center Play / Pause */}
        <button
          type="button"
          onClick={onTogglePlayPause}
          className={`flex items-center gap-1.5 px-4 py-1 rounded-md text-xs font-bold shadow-sm transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
          title={isPlaying ? 'Pause Video Layer' : 'Play Video Layer'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Video</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {/* +5s */}
          <button
            type="button"
            onClick={() => onSkip(5)}
            className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Step forward 5 seconds"
          >
            <span>+5s</span>
            <FastForward className="w-3 h-3" />
          </button>

          {/* +10s */}
          <button
            type="button"
            onClick={() => onSkip(10)}
            className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Step forward 10 seconds"
          >
            <span>+10s</span>
            <FastForward className="w-3 h-3" />
          </button>

          {/* End */}
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, duration - 0.5))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors"
            title="Jump towards end"
          >
            <span>End</span>
            <SkipForward className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
