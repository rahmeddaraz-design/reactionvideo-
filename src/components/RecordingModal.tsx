import React from 'react';
import { 
  RecordingTake 
} from '../types';
import { 
  Download, 
  Trash2, 
  X, 
  Film, 
  Clock, 
  HardDrive, 
  CheckCircle2,
  Play
} from 'lucide-react';

interface RecordingModalProps {
  countdownNumber: number | null;
  onCancelCountdown: () => void;
  takes: RecordingTake[];
  selectedTake: RecordingTake | null;
  onSelectTake: (take: RecordingTake) => void;
  onDeleteTake: (takeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  countdownNumber,
  onCancelCountdown,
  takes,
  selectedTake,
  onSelectTake,
  onDeleteTake,
  isOpen,
  onClose
}) => {
  // If countdown is active, show dramatic 3-2-1 studio overlay
  if (countdownNumber !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white select-none animate-in fade-in">
        <div className="text-[120px] font-black text-rose-500 animate-bounce tracking-tighter drop-shadow-[0_0_35px_rgba(244,63,94,0.8)]">
          {countdownNumber === 0 ? 'REC' : countdownNumber}
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-slate-300 mt-4">
          Ahmed Reaction Studio &bull; Standby
        </p>
        <button
          type="button"
          onClick={onCancelCountdown}
          className="mt-8 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
        >
          Cancel Countdown
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  const formatDuration = (ms: number) => {
    const secs = Math.round(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const currentTake = selectedTake || takes[takes.length - 1];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Recorded Studio Takes ({takes.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {takes.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-40 stroke-1" />
              <p className="text-sm font-medium text-slate-300">No takes recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Hit the red &quot;REC&quot; button in the top bar to record your multi-PiP reaction take!
              </p>
            </div>
          ) : (
            <>
              {/* Active Take Player Preview */}
              {currentTake && (
                <div className="space-y-3">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                    <video
                      src={currentTake.blobUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Take Info & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">{currentTake.name}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {formatDuration(currentTake.durationMs)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-emerald-400" />
                          {formatSize(currentTake.blobSize)}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-700 text-[10px] text-slate-300">
                          {currentTake.canvasAspect}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Download Take */}
                      <a
                        href={currentTake.blobUrl}
                        download={`${currentTake.name.toLowerCase().replace(/\s+/g, '-')}.${
                          currentTake.mimeType.includes('mp4') ? 'mp4' : 'webm'
                        }`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Video</span>
                      </a>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteTake(currentTake.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        title="Delete this take"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Take List */}
              {takes.length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    All Recorded Takes
                  </h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {takes.map((take) => (
                      <div
                        key={take.id}
                        onClick={() => onSelectTake(take)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          take.id === currentTake?.id
                            ? 'bg-sky-500/10 border-sky-500/50 text-white'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Play className="w-3 h-3 text-sky-400" />
                          <span className="font-semibold">{take.name}</span>
                          <span className="text-[10px] text-slate-400">({formatDuration(take.durationMs)})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{formatSize(take.blobSize)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
