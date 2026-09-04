import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ListOrdered, 
  Clock, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import { TimelineEvent } from '../types';

interface TimelineScrubberProps {
  currentTime: number;
  duration: number;
  isPlayingAll: boolean;
  onPlayAll: () => void;
  onPauseAll: () => void;
  onResetAll: () => void;
  onSeek: (time: number) => void;
  events: TimelineEvent[];
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTime,
  duration,
  isPlayingAll,
  onPlayAll,
  onPauseAll,
  onResetAll,
  onSeek,
  events
}) => {
  const [showEventLog, setShowEventLog] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="bg-slate-900/95 border-t border-slate-800 p-2.5 select-none text-slate-200">
      {/* Upper bar: Play/Pause/Reset Controls, Master Time, Events Counter */}
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Global Controls */}
        <div className="flex items-center gap-1.5">
          {!isPlayingAll ? (
            <button
              type="button"
              onClick={onPlayAll}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Play all active video layers"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPauseAll}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Pause all video layers"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause All</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Reset playback to beginning (00:00.0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Clock Time Readout */}
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-100 font-bold">{formatTime(currentTime)}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{formatTime(duration || 60)}</span>
        </div>

        {/* Event Log Toggle */}
        <button
          type="button"
          onClick={() => setShowEventLog(!showEventLog)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-colors ${
            showEventLog
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Timeline Event Log"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Events ({events.length})</span>
          {showEventLog ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Scrubber Track */}
      <div 
        className="relative h-4 bg-slate-950 rounded border border-slate-800 cursor-pointer overflow-hidden group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(pct * (duration || 60));
        }}
      >
        {/* Progress Fill */}
        <div
          className="h-full bg-sky-600/60 rounded-l transition-all pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Scrubber Playhead Handle */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-sky-400 shadow-md transform -translate-x-1/2 pointer-events-none"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Event Markers on Timeline */}
        {events.map((ev) => {
          const evPct = duration > 0 ? (ev.mediaTime / duration) * 100 : 0;
          return (
            <div
              key={ev.id}
              className="absolute top-0 w-1 h-2 bg-amber-400/80 rounded-b pointer-events-none"
              style={{ left: `${evPct}%` }}
              title={`${ev.action} on ${ev.layerName}`}
            />
          );
        })}
      </div>

      {/* Collapsible Event Log Drawer */}
      {showEventLog && (
        <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded-md max-h-36 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {events.length === 0 ? (
            <div className="text-slate-500 text-center py-2">No timeline events recorded yet.</div>
          ) : (
            [...events].reverse().map((ev) => (
              <div key={ev.id} className="flex items-center justify-between py-0.5 border-b border-slate-900">
                <span className="text-sky-400 font-semibold">{formatTime(ev.mediaTime)}</span>
                <span className="text-slate-200">{ev.layerName}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300 uppercase">
                  {ev.action}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
