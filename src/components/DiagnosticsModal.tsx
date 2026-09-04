import React, { useEffect, useState } from 'react';
import { 
  X, 
  Activity, 
  ShieldCheck, 
  Camera, 
  Volume2, 
  Film, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { detectPlatform, enumerateCameras, isMobileDevice } from '../utils/camera';
import { studioAudio } from '../utils/audio';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderFps: number;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  renderFps
}) => {
  const [platform, setPlatform] = useState<string>('Detecting...');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [screenInfo, setScreenInfo] = useState<string>('');
  const [dpr, setDpr] = useState<number>(1);
  const [touchSupported, setTouchSupported] = useState<boolean>(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [audioInfo, setAudioInfo] = useState<{ sampleRate: number; state: string }>({ sampleRate: 48000, state: 'unknown' });
  const [supportedCodecs, setSupportedCodecs] = useState<{ mime: string; supported: boolean }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setPlatform(detectPlatform().toUpperCase());
    setIsMobile(isMobileDevice());
    setDpr(window.devicePixelRatio || 1);
    setScreenInfo(`${window.innerWidth} × ${window.innerHeight} (Screen: ${window.screen?.width} × ${window.screen?.height})`);
    setTouchSupported(Boolean('ontouchstart' in window || navigator.maxTouchPoints > 0));

    // Audio status
    try {
      const ctx = studioAudio.getContext();
      setAudioInfo({ sampleRate: ctx.sampleRate, state: ctx.state });
    } catch {
      setAudioInfo({ sampleRate: 44100, state: 'unavailable' });
    }

    // Camera enumeration
    enumerateCameras().then((devices) => {
      setCameras(devices.map(d => ({ id: d.deviceId, label: d.label })));
    });

    // Check MediaRecorder codecs
    const codecsToCheck = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4'
    ];

    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      const results = codecsToCheck.map(mime => ({
        mime,
        supported: MediaRecorder.isTypeSupported(mime)
      }));
      setSupportedCodecs(results);
    } else {
      setSupportedCodecs(codecsToCheck.map(mime => ({ mime, supported: false })));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              System &amp; Hardware Diagnostics
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
          {/* Health Summary Card */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Canvas Compositor FPS</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {renderFps.toFixed(1)} <span className="text-xs font-normal text-slate-400">FPS</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Optimal Studio Health</span>
              </span>
            </div>
          </div>

          {/* Device & Environment */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              {isMobile ? <Smartphone className="w-3.5 h-3.5 text-sky-400" /> : <Monitor className="w-3.5 h-3.5 text-sky-400" />}
              <span>Hardware &amp; Display Target</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Platform:</span>{' '}
                <span className="font-semibold text-slate-200">{platform}</span>
              </div>
              <div>
                <span className="text-slate-500">Form Factor:</span>{' '}
                <span className="font-semibold text-slate-200">{isMobile ? 'Mobile / Tablet' : 'Desktop / Laptop'}</span>
              </div>
              <div>
                <span className="text-slate-500">Screen Size:</span>{' '}
                <span className="font-semibold text-slate-200">{screenInfo}</span>
              </div>
              <div>
                <span className="text-slate-500">Device Pixel Ratio:</span>{' '}
                <span className="font-semibold text-slate-200">{dpr}x</span>
              </div>
              <div>
                <span className="text-slate-500">Touch Interface:</span>{' '}
                <span className="font-semibold text-slate-200">{touchSupported ? 'Yes (Touch/Stylus)' : 'Mouse Only'}</span>
              </div>
              <div>
                <span className="text-slate-500">Android Camera Limit:</span>{' '}
                <span className="font-semibold text-sky-400">2 Physical Max</span>
              </div>
            </div>
          </div>

          {/* Camera Sensors */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-rose-400" />
                <span>Detected Cameras ({cameras.length})</span>
              </div>
            </div>

            {cameras.length === 0 ? (
              <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>No physical webcam or permission pending. Simulated studio camera active.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {cameras.map((c, i) => (
                  <div key={c.id || i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-200 font-medium truncate">{c.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400">Ready</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MediaRecorder & Codecs */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Browser MediaRecorder Encoders</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              {supportedCodecs.map((codec) => (
                <div 
                  key={codec.mime}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800"
                >
                  <span className="font-mono text-[10px] text-slate-300 truncate max-w-[180px]">{codec.mime}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    codec.supported ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {codec.supported ? 'Supported' : 'Unsupported'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Web Audio API Engine */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Web Audio Mixer Engine</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500">AudioContext State:</span>{' '}
                <span className="font-semibold text-emerald-400 uppercase">{audioInfo.state}</span>
              </div>
              <div>
                <span className="text-slate-500">Sample Rate:</span>{' '}
                <span className="font-semibold text-slate-200">{audioInfo.sampleRate} Hz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
