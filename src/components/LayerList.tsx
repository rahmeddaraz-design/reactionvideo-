import React, { useRef, useState } from 'react';
import { 
  StudioLayer, 
  LayerType 
} from '../types';
import { 
  Layers, 
  Plus, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Video, 
  Camera, 
  Monitor, 
  Image as ImageIcon,
  Sparkles,
  Upload,
  RefreshCw,
  Clock
} from 'lucide-react';
import { SAMPLE_VIDEOS } from '../data/sampleMedia';

interface LayerListProps {
  layers: StudioLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleMute: (id: string) => void;
  onVolumeChange: (id: string, vol: number) => void;
  onTogglePlayPause: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLocalVideo: (file: File) => void;
  onAddSampleVideo: (sampleUrl: string, name: string) => void;
  onAddCamera: (facing?: 'user' | 'environment') => void;
  onSwitchCameraFacing?: (layerId: string) => void;
  onAddScreenShare: () => void;
  onAddImage: (file: File) => void;
  isMobile: boolean;
}

export const LayerList: React.FC<LayerListProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onToggleMute,
  onVolumeChange,
  onTogglePlayPause,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onAddLocalVideo,
  onAddSampleVideo,
  onAddCamera,
  onSwitchCameraFacing,
  onAddScreenShare,
  onAddImage
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSampleSubmenu, setShowSampleSubmenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddLocalVideo(file);
      e.target.value = '';
      setShowAddMenu(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      e.target.value = '';
      setShowAddMenu(false);
    }
  };

  const getTypeIcon = (type: LayerType) => {
    switch (type) {
      case 'camera':
        return <Camera className="w-3.5 h-3.5 text-rose-400" />;
      case 'screen':
        return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Video className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  // Layers are displayed with highest Z-index at the top of the list
  const sortedLayers = [...layers].reverse();

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 select-none text-slate-200">
      {/* Hidden file inputs with wide container and codec support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,video/mp4,video/webm,video/x-matroska,video/quicktime,video/x-msvideo,video/3gpp,video/ogg,video/avi,video/x-flv,audio/*,.mp4,.webm,.mkv,.mov,.avi,.m4v,.ts,.3gp,.ogv,.flv,.wmv,.mp3,.wav,.ogg,.m4a"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg"
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Header with + Add Layer button */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 tracking-wide uppercase">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Layers ({layers.length})</span>
        </div>

        {/* Add Media Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowAddMenu(!showAddMenu);
              setShowSampleSubmenu(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>

          {/* Add Menu Dropdown */}
          {showAddMenu && (
            <div 
              className="absolute right-0 top-full mt-1.5 w-60 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2.5 text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-medium">Upload Video or Audio</div>
                  <div className="text-[10px] text-slate-400">MP4, WebM, MKV, MOV, AVI, 3GP</div>
                </div>
              </button>

              {/* Front Camera */}
              <button
                type="button"
                onClick={() => {
                  onAddCamera('user');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2.5 text-slate-200 transition-colors"
              >
                <Camera className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-medium">Front Camera (Selfie)</div>
                  <div className="text-[10px] text-slate-400">Host commentary / reaction lens</div>
                </div>
              </button>

              {/* Back Camera */}
              <button
                type="button"
                onClick={() => {
                  onAddCamera('environment');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2.5 text-slate-200 transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium">Back Camera (Rear)</div>
                  <div className="text-[10px] text-slate-400">Environment / room / desk view</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddScreenShare();
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2.5 text-slate-200 transition-colors"
              >
                <Monitor className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-medium">Screen Capture</div>
                  <div className="text-[10px] text-slate-400">Commentary & reaction screen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2.5 text-slate-200 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium">Image / Watermark</div>
                  <div className="text-[10px] text-slate-400">PNG, JPEG, WebP overlay</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-700/60" />

              <button
                type="button"
                onClick={() => setShowSampleSubmenu(!showSampleSubmenu)}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center justify-between text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-medium">Built-in Sample Clips</span>
                </div>
                <span className="text-[10px] text-sky-400 font-semibold">{SAMPLE_VIDEOS.length}</span>
              </button>

              {showSampleSubmenu && (
                <div className="bg-slate-900/90 py-1 border-y border-slate-700/40">
                  {SAMPLE_VIDEOS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onAddSampleVideo(item.url, item.name);
                        setShowAddMenu(false);
                        setShowSampleSubmenu(false);
                      }}
                      className="w-full px-4 py-1.5 text-left hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-between"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[9px] text-slate-400 px-1 py-0.2 rounded bg-slate-800 border border-slate-700 shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Layer Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {layers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <Layers className="w-8 h-8 mb-2 stroke-1 opacity-50" />
            <p className="text-xs font-medium text-slate-400">No media layers yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
              Click &quot;+ Add Source&quot; to add videos, cameras, or screen share.
            </p>
          </div>
        ) : (
          sortedLayers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            const originalIndex = layers.findIndex(l => l.id === layer.id);

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group rounded-lg border p-2 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/95 border-sky-500/80 shadow-sm shadow-sky-500/10 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Z-order controls, icon, name, and status badges */}
                <div className="flex items-center gap-1.5 justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="shrink-0 p-1 rounded bg-slate-900 border border-slate-800">
                      {getTypeIcon(layer.type)}
                    </span>
                    <span className={`font-semibold truncate text-[12px] ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                      {layer.name}
                    </span>
                    {layer.type === 'camera' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase font-semibold shrink-0">
                        {layer.facingMode === 'environment' ? 'Rear' : 'Front'}
                      </span>
                    )}
                  </div>

                  {/* Quick Camera Flip or Z-Index Order Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {layer.type === 'camera' && onSwitchCameraFacing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSwitchCameraFacing(layer.id);
                        }}
                        className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors mr-1"
                        title={`Flip camera (${layer.facingMode === 'environment' ? 'Switch to Front' : 'Switch to Back'})`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={originalIndex === layers.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(layer.id, 'up');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-700"
                      title="Bring Forward (Higher Z)"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={originalIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveLayer(layer.id, 'down');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-700"
                      title="Send Backward (Lower Z)"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Controls (Eye, Lock, Play/Pause, Mute, Volume, Duplicate, Delete) */}
                <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between gap-1">
                  {/* Left group: Visibility, Lock, Play/Pause */}
                  <div className="flex items-center gap-1">
                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.visible ? 'text-slate-300 hover:text-white' : 'text-rose-400 bg-rose-500/10'
                      }`}
                      title={layer.visible ? 'Hide layer (keeps media playing)' : 'Show layer'}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.locked ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={layer.locked ? 'Unlock transform geometry' : 'Lock position & size'}
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Independent Play / Pause (for video layers) */}
                    {layer.type === 'video' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePlayPause(layer.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          layer.playing ? 'text-emerald-400' : 'text-amber-400 bg-amber-500/10'
                        }`}
                        title={layer.playing ? 'Pause video (freezes on current frame)' : 'Play video'}
                      >
                        {layer.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Mute toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMute(layer.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        layer.muted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-300 hover:text-white'
                      }`}
                      title={layer.muted ? 'Unmute' : 'Mute'}
                    >
                      {layer.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5 flex-1 max-w-[80px]">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.muted ? 0 : layer.volume}
                      disabled={layer.muted}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        onVolumeChange(layer.id, parseFloat(e.target.value));
                      }}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-40"
                      title={`Volume: ${Math.round(layer.volume * 100)}%`}
                    />
                  </div>

                  {/* Duplicate & Delete */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateLayer(layer.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded"
                      title="Duplicate Layer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
