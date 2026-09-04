import React from 'react';
import { 
  X, 
  Settings, 
  Film, 
  Camera, 
  Volume2, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Sliders, 
  Sparkles,
  Info
} from 'lucide-react';
import { RecordQualityConfig, CanvasAspectRatio } from '../types';
import { getSupportedExportCodecs } from '../utils/camera';

interface ExportQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecordQualityConfig;
  onChangeConfig: (newConfig: RecordQualityConfig) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  aspectRatio: CanvasAspectRatio;
}

export const ExportQualityModal: React.FC<ExportQualityModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  canvasRef,
  aspectRatio
}) => {
  if (!isOpen) return null;

  const supportedCodecs = getSupportedExportCodecs();

  const handleResolutionChange = (res: RecordQualityConfig['resolutionPreset']) => {
    let bit = config.videoBitrate;
    if (res === '4k') bit = 8000000;
    else if (res === '1080p') bit = 5000000;
    else if (res === '720p') bit = 3500000;
    else if (res === '480p') bit = 1800000;

    onChangeConfig({
      ...config,
      resolutionPreset: res,
      videoBitrate: bit
    });
  };

  const handleCaptureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `reaction-studio-snapshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert(`Snapshot capture error: ${(e as Error).message}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Recording Quality &amp; Export Configuration
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

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Resolution Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-sky-400" />
              <span>Canvas Output Resolution</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: '4k', label: '4K UHD', sub: aspectRatio === '16:9' ? '3840×2160' : aspectRatio === '9:16' ? '2160×3840' : '2160×2160' },
                { key: '1080p', label: '1080p Full HD', sub: aspectRatio === '16:9' ? '1920×1080' : aspectRatio === '9:16' ? '1080×1920' : '1080×1080' },
                { key: '720p', label: '720p HD', sub: aspectRatio === '16:9' ? '1280×720' : aspectRatio === '9:16' ? '720×1280' : '720×720' },
                { key: '480p', label: '480p Mobile', sub: aspectRatio === '16:9' ? '854×480' : aspectRatio === '9:16' ? '480×854' : '480×480' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleResolutionChange(item.key as RecordQualityConfig['resolutionPreset'])}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    config.resolutionPreset === item.key
                      ? 'bg-sky-500/20 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Framerate & Bitrate Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target FPS */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Target Capture Framerate
              </label>
              <div className="flex items-center gap-1.5">
                {[60, 30, 24].map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, targetFps: fps as 60 | 30 | 24 })}
                    className={`flex-1 py-1.5 rounded-md border text-center font-bold text-xs transition-colors ${
                      config.targetFps === fps
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Video Bitrate */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Video Encoder Bitrate</span>
                <span className="font-mono text-sky-400 font-bold">{(config.videoBitrate / 1000000).toFixed(1)} Mbps</span>
              </div>
              <input
                type="range"
                min="1000000"
                max="12000000"
                step="500000"
                value={config.videoBitrate}
                onChange={(e) => onChangeConfig({ ...config, videoBitrate: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.0M (Light)</span>
                <span>5.0M (Recommended)</span>
                <span>12.0M (Lossless)</span>
              </div>
            </div>
          </div>

          {/* Container & Codec Selector */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Container Format &amp; Codec Preference
            </label>
            <div className="space-y-1.5">
              {supportedCodecs.map((codec) => (
                <div
                  key={codec.mimeType}
                  onClick={() => {
                    if (codec.supported) {
                      onChangeConfig({ ...config, preferredMimeType: codec.mimeType });
                    }
                  }}
                  className={`p-2 rounded-md border flex items-center justify-between text-xs transition-all ${
                    !codec.supported
                      ? 'opacity-40 bg-slate-900 border-slate-800 cursor-not-allowed'
                      : config.preferredMimeType === codec.mimeType
                      ? 'bg-sky-500/20 border-sky-500 text-white cursor-pointer'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>{codec.label}</span>
                      {config.preferredMimeType === codec.mimeType && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">{codec.mimeType}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    codec.supported ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {codec.supported ? 'Supported' : 'Not in Browser'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Rewind Toggle on Start Record */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Rewind Videos When Recording Starts</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Automatically reset all local and reaction videos to 00:00:00 when the REC countdown completes so your take starts cleanly from frame 1.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, autoRewindOnRecord: !config.autoRewindOnRecord })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                config.autoRewindOnRecord ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.autoRewindOnRecord ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Instant Snapshot Tool */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Capture Canvas Frame Snapshot</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Save the current composited multi-layer frame as a high-resolution PNG image thumbnail.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Selected: <span className="font-mono text-sky-400">{config.resolutionPreset.toUpperCase()} @ {config.targetFps}fps ({(config.videoBitrate/1000000).toFixed(1)}Mbps)</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
