import React, { useEffect, useState } from 'react';
import { StudioLayer } from '../types';
import { studioAudio } from '../utils/audio';
import { Volume2, VolumeX, AlertTriangle } from 'lucide-react';

interface AudioMixerProps {
  layers: StudioLayer[];
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  onLayerVolumeChange: (id: string, vol: number) => void;
  onLayerToggleMute: (id: string) => void;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
  layers,
  masterVolume,
  onMasterVolumeChange,
  onLayerVolumeChange,
  onLayerToggleMute
}) => {
  const [level, setLevel] = useState<{ rms: number; peak: number; clipping: boolean }>({
    rms: 0,
    peak: 0,
    clipping: false
  });

  // Continuous animation frame to sample real-time VU meter
  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      const currentLevel = studioAudio.getMasterLevel();
      setLevel(currentLevel);
      animId = requestAnimationFrame(updateMeter);
    };

    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, []);

  const rmsPercent = Math.min(100, Math.round(level.rms * 100));
  const peakPercent = Math.min(100, Math.round(level.peak * 100));

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3 select-none text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Master Output & VU Level Meter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 min-w-[120px]">
            <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Master Mix
            </span>
          </div>

          {/* Master VU Meter Bar */}
          <div className="flex items-center gap-1.5 flex-1 sm:w-48">
            <div className="relative flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              {/* RMS Level fill */}
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                style={{ width: `${rmsPercent}%` }}
              />
              {/* Peak indicator notch */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                style={{ left: `${peakPercent}%` }}
              />
            </div>

            {/* Clipping Indicator LED */}
            <div
              className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                level.clipping
                  ? 'bg-rose-500 border-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-slate-800 border-slate-700'
              }`}
              title={level.clipping ? 'Audio Clipping Warning!' : 'Nominal Headroom'}
            />
          </div>

          {/* Master Volume Slider */}
          <div className="flex items-center gap-2 w-28">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
            />
            <span className="text-[11px] font-mono text-slate-400 w-7 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Quick Layer Track Channels */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1 scrollbar-none">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/60 rounded-md border border-slate-800 text-xs shrink-0"
            >
              <button
                type="button"
                onClick={() => onLayerToggleMute(layer.id)}
                className={`p-0.5 rounded transition-colors ${
                  layer.muted ? 'text-rose-400' : 'text-slate-300 hover:text-white'
                }`}
                title={layer.muted ? 'Unmute' : 'Mute'}
              >
                {layer.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <span className="text-[11px] font-medium text-slate-300 max-w-[80px] truncate">
                {layer.name}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={layer.muted ? 0 : layer.volume}
                disabled={layer.muted}
                onChange={(e) => onLayerVolumeChange(layer.id, parseFloat(e.target.value))}
                className="w-14 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400 disabled:opacity-30"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
