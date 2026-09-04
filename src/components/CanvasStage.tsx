import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CanvasAspectRatio, 
  HandleType, 
  NormalizedGeometry, 
  StudioLayer 
} from '../types';
import { snapGeometry } from '../utils/presets';
import { EyeOff, Lock, VolumeX, Move } from 'lucide-react';

interface CanvasStageProps {
  aspectRatio: CanvasAspectRatio;
  zoomMode: 'fit' | 'fill' | '100%' | '75%';
  layers: StudioLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayerGeometry: (id: string, geometry: NormalizedGeometry) => void;
  snapEnabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isMobile: boolean;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  aspectRatio,
  zoomMode,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerGeometry,
  snapEnabled,
  canvasRef,
  isMobile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 450 });
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    initialGeom: NormalizedGeometry;
  } | null>(null);

  const [activeGuides, setActiveGuides] = useState<{ x?: number; y?: number }>({});

  // Logical render dimensions
  const logicalWidth = aspectRatio === '9:16' ? 1080 : 1920;
  const logicalHeight = aspectRatio === '16:9' ? 1080 : aspectRatio === '9:16' ? 1920 : 1080;
  const targetAspect = logicalWidth / logicalHeight;

  // Track container resize to keep canvas letterbox-fitted dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute CSS display dimensions for canvas based on zoomMode and container aspect ratio
  const computeDisplaySize = useCallback(() => {
    const { width: cW, height: cH } = containerDimensions;
    const padding = isMobile ? 8 : 24;
    const availW = Math.max(100, cW - padding * 2);
    const availH = Math.max(100, cH - padding * 2);

    if (zoomMode === 'fill') {
      const containerAspect = availW / availH;
      if (containerAspect > targetAspect) {
        return { width: availW, height: availW / targetAspect };
      }
      return { width: availH * targetAspect, height: availH };
    }

    if (zoomMode === '100%') {
      return { width: logicalWidth, height: logicalHeight };
    }

    if (zoomMode === '75%') {
      return { width: logicalWidth * 0.75, height: logicalHeight * 0.75 };
    }

    // Default 'fit': scale down to fit container while keeping exact aspect ratio
    const scale = Math.min(availW / logicalWidth, availH / logicalHeight);
    return {
      width: Math.round(logicalWidth * scale),
      height: Math.round(logicalHeight * scale)
    };
  }, [containerDimensions, targetAspect, logicalWidth, logicalHeight, zoomMode, isMobile]);

  const displaySize = computeDisplaySize();

  // Continuous animation / compositor loop on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set backing store dimensions to authoritative logical resolution
    if (canvas.width !== logicalWidth || canvas.height !== logicalHeight) {
      canvas.width = logicalWidth;
      canvas.height = logicalHeight;
    }

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas with deep dark studio slate
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Render each visible layer in bottom-to-top Z-order
      for (const layer of layers) {
        if (!layer.visible) continue;

        const lx = layer.geometry.x * logicalWidth;
        const ly = layer.geometry.y * logicalHeight;
        const lw = layer.geometry.w * logicalWidth;
        const lh = layer.geometry.h * logicalHeight;

        ctx.save();
        ctx.globalAlpha = layer.opacity;

        // Apply rounded corners clip if set
        if (layer.cornerRadius > 0) {
          ctx.beginPath();
          const r = Math.min(layer.cornerRadius, lw / 2, lh / 2);
          ctx.roundRect(lx, ly, lw, lh, r);
          ctx.clip();
        }

        // Draw media element
        const media = layer.mediaElement;
        if (media) {
          ctx.save();
          // Handle horizontal mirror for selfie camera
          if (layer.mirrored) {
            ctx.translate(lx + lw, ly);
            ctx.scale(-1, 1);
          } else {
            ctx.translate(lx, ly);
          }

          const drawX = 0;
          const drawY = 0;

          if (media instanceof HTMLVideoElement || media instanceof HTMLImageElement) {
            const srcW = media instanceof HTMLVideoElement ? (media.videoWidth || 640) : (media.naturalWidth || 640);
            const srcH = media instanceof HTMLVideoElement ? (media.videoHeight || 480) : (media.naturalHeight || 480);
            
            if (layer.fitMode === 'cover') {
              // Cover crop
              const sRatio = srcW / srcH;
              const dRatio = lw / lh;
              let sW = srcW;
              let sH = srcH;
              let sX = 0;
              let sY = 0;

              if (sRatio > dRatio) {
                sW = srcH * dRatio;
                sX = (srcW - sW) / 2;
              } else {
                sH = srcW / dRatio;
                sY = (srcH - sH) / 2;
              }
              ctx.drawImage(media, sX, sY, sW, sH, drawX, drawY, lw, lh);
            } else if (layer.fitMode === 'contain') {
              // Contain pillar/letterbox inside layer rectangle
              const sRatio = srcW / srcH;
              const dRatio = lw / lh;
              let dW = lw;
              let dH = lh;
              let oX = 0;
              let oY = 0;

              if (sRatio > dRatio) {
                dH = lw / sRatio;
                oY = (lh - dH) / 2;
              } else {
                dW = lh * sRatio;
                oX = (lw - dW) / 2;
              }
              // Fill background of box
              ctx.fillStyle = '#000000';
              ctx.fillRect(drawX, drawY, lw, lh);
              ctx.drawImage(media, drawX + oX, drawY + oY, dW, dH);
            } else {
              // Stretch fit
              ctx.drawImage(media, drawX, drawY, lw, lh);
            }
          }
          ctx.restore();
        } else {
          // Placeholder gradient if media is loading or missing
          const grad = ctx.createLinearGradient(lx, ly, lx + lw, ly + lh);
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(lx, ly, lw, lh);

          ctx.fillStyle = '#64748b';
          ctx.font = `bold ${Math.max(14, Math.round(lh * 0.08))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.name, lx + lw / 2, ly + lh / 2);
        }

        // Draw border if configured
        if (layer.borderWidth > 0) {
          ctx.strokeStyle = layer.borderColor;
          ctx.lineWidth = layer.borderWidth * 2; // Compensate for clip
          ctx.strokeRect(lx, ly, lw, lh);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [layers, logicalWidth, logicalHeight, canvasRef]);

  // Find selected layer
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Pointer event handlers for the 8-handle PiP editor overlay
  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedLayer || selectedLayer.locked) return;

    // Set pointer capture so dragging doesn't break if pointer leaves canvas
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(handle);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialGeom: { ...selectedLayer.geometry }
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStart || !selectedLayer) return;

    const deltaX = (e.clientX - dragStart.pointerX) / displaySize.width;
    const deltaY = (e.clientY - dragStart.pointerY) / displaySize.height;

    let newGeom: NormalizedGeometry = { ...dragStart.initialGeom };
    const minW = 0.08;
    const minH = 0.08;

    switch (activeHandle) {
      case 'move':
        newGeom.x = Math.max(0, Math.min(1.0 - newGeom.w, dragStart.initialGeom.x + deltaX));
        newGeom.y = Math.max(0, Math.min(1.0 - newGeom.h, dragStart.initialGeom.y + deltaY));
        break;

      case 'se': { // South East (bottom-right)
        const proposedW = Math.max(minW, Math.min(1.0 - newGeom.x, dragStart.initialGeom.w + deltaX));
        if (selectedLayer.aspectLocked && selectedLayer.sourceAspectRatio) {
          const proposedH = (proposedW * logicalWidth) / (selectedLayer.sourceAspectRatio * logicalHeight);
          if (newGeom.y + proposedH <= 1.0) {
            newGeom.w = proposedW;
            newGeom.h = proposedH;
          }
        } else {
          newGeom.w = proposedW;
          newGeom.h = Math.max(minH, Math.min(1.0 - newGeom.y, dragStart.initialGeom.h + deltaY));
        }
        break;
      }

      case 'nw': { // North West (top-left)
        const proposedW = Math.max(minW, dragStart.initialGeom.w - deltaX);
        const proposedX = dragStart.initialGeom.x + (dragStart.initialGeom.w - proposedW);
        const proposedH = Math.max(minH, dragStart.initialGeom.h - deltaY);
        const proposedY = dragStart.initialGeom.y + (dragStart.initialGeom.h - proposedH);

        if (proposedX >= 0) {
          newGeom.x = proposedX;
          newGeom.w = proposedW;
        }
        if (proposedY >= 0) {
          newGeom.y = proposedY;
          newGeom.h = proposedH;
        }
        break;
      }

      case 'ne': { // North East (top-right)
        const proposedW = Math.max(minW, Math.min(1.0 - newGeom.x, dragStart.initialGeom.w + deltaX));
        const proposedH = Math.max(minH, dragStart.initialGeom.h - deltaY);
        const proposedY = dragStart.initialGeom.y + (dragStart.initialGeom.h - proposedH);

        newGeom.w = proposedW;
        if (proposedY >= 0) {
          newGeom.y = proposedY;
          newGeom.h = proposedH;
        }
        break;
      }

      case 'sw': { // South West (bottom-left)
        const proposedW = Math.max(minW, dragStart.initialGeom.w - deltaX);
        const proposedX = dragStart.initialGeom.x + (dragStart.initialGeom.w - proposedW);
        const proposedH = Math.max(minH, Math.min(1.0 - newGeom.y, dragStart.initialGeom.h + deltaY));

        if (proposedX >= 0) {
          newGeom.x = proposedX;
          newGeom.w = proposedW;
        }
        newGeom.h = proposedH;
        break;
      }

      case 'e': // East (Right side)
        newGeom.w = Math.max(minW, Math.min(1.0 - newGeom.x, dragStart.initialGeom.w + deltaX));
        break;

      case 'w': { // West (Left side)
        const proposedW = Math.max(minW, dragStart.initialGeom.w - deltaX);
        const proposedX = dragStart.initialGeom.x + (dragStart.initialGeom.w - proposedW);
        if (proposedX >= 0) {
          newGeom.x = proposedX;
          newGeom.w = proposedW;
        }
        break;
      }

      case 's': // South (Bottom side)
        newGeom.h = Math.max(minH, Math.min(1.0 - newGeom.y, dragStart.initialGeom.h + deltaY));
        break;

      case 'n': { // North (Top side)
        const proposedH = Math.max(minH, dragStart.initialGeom.h - deltaY);
        const proposedY = dragStart.initialGeom.y + (dragStart.initialGeom.h - proposedH);
        if (proposedY >= 0) {
          newGeom.y = proposedY;
          newGeom.h = proposedH;
        }
        break;
      }
    }

    // Apply snapping if enabled
    if (snapEnabled) {
      const snapResult = snapGeometry(newGeom);
      newGeom = snapResult.snapped;
      setActiveGuides(snapResult.guides);
    } else {
      setActiveGuides({});
    }

    onUpdateLayerGeometry(selectedLayer.id, newGeom);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveHandle(null);
      setDragStart(null);
      setActiveGuides({});
    }
  };

  // Keyboard nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayer || selectedLayer.locked) return;
      // Don't nudge if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = e.shiftKey ? 0.05 : 0.01;
      let newGeom = { ...selectedLayer.geometry };
      let handled = false;

      if (e.key === 'ArrowLeft') {
        newGeom.x = Math.max(0, newGeom.x - step);
        handled = true;
      } else if (e.key === 'ArrowRight') {
        newGeom.x = Math.min(1.0 - newGeom.w, newGeom.x + step);
        handled = true;
      } else if (e.key === 'ArrowUp') {
        newGeom.y = Math.max(0, newGeom.y - step);
        handled = true;
      } else if (e.key === 'ArrowDown') {
        newGeom.y = Math.min(1.0 - newGeom.h, newGeom.y + step);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        onUpdateLayerGeometry(selectedLayer.id, newGeom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, onUpdateLayerGeometry]);

  // Touch handle size: 44px for touch / mobile, 18px for mouse
  const handleSize = isMobile ? 36 : 14;

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full h-full min-h-[280px] bg-slate-950 flex items-center justify-center relative overflow-hidden select-none p-2 sm:p-4"
      onClick={() => onSelectLayer(null)}
    >
      {/* Studio Monitor Frame / Canvas Container */}
      <div 
        className="relative shadow-2xl shadow-black/80 rounded-lg overflow-hidden border border-slate-800/80 bg-black flex items-center justify-center transition-all"
        style={{
          width: `${displaySize.width}px`,
          height: `${displaySize.height}px`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authoritative Main Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'auto' }}
        />

        {/* Snap Guide Visual Lines */}
        {activeGuides.x !== undefined && (
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-sky-400 z-20 pointer-events-none shadow-[0_0_8px_#38bdf8]"
            style={{ left: `${activeGuides.x * 100}%` }}
          />
        )}
        {activeGuides.y !== undefined && (
          <div 
            className="absolute left-0 right-0 h-[1px] bg-sky-400 z-20 pointer-events-none shadow-[0_0_8px_#38bdf8]"
            style={{ top: `${activeGuides.y * 100}%` }}
          />
        )}

        {/* 8-Handle Interactive PiP Editor Overlay for Selected Layer */}
        {selectedLayer && selectedLayer.visible && !selectedLayer.locked && (
          <div
            className="absolute border-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] z-30 transition-shadow pointer-events-auto"
            style={{
              left: `${selectedLayer.geometry.x * 100}%`,
              top: `${selectedLayer.geometry.y * 100}%`,
              width: `${selectedLayer.geometry.w * 100}%`,
              height: `${selectedLayer.geometry.h * 100}%`
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Center Drag to Move Area */}
            <div
              className="absolute inset-0 cursor-move flex items-center justify-center group touch-none"
              onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
              <div className="opacity-0 group-hover:opacity-90 bg-slate-900/80 text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-md pointer-events-none transition-opacity">
                <Move className="w-3 h-3 text-sky-400" />
                <span>{selectedLayer.name}</span>
              </div>
            </div>

            {/* Corner Handles (NW, NE, SW, SE) */}
            <div
              className="absolute cursor-nwse-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize}px`,
                left: `-${handleSize / 2}px`,
                top: `-${handleSize / 2}px`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'nw')}
              title="Resize Corner Top-Left"
            />
            <div
              className="absolute cursor-nesw-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize}px`,
                right: `-${handleSize / 2}px`,
                top: `-${handleSize / 2}px`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'ne')}
              title="Resize Corner Top-Right"
            />
            <div
              className="absolute cursor-nesw-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize}px`,
                left: `-${handleSize / 2}px`,
                bottom: `-${handleSize / 2}px`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'sw')}
              title="Resize Corner Bottom-Left"
            />
            <div
              className="absolute cursor-nwse-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize}px`,
                right: `-${handleSize / 2}px`,
                bottom: `-${handleSize / 2}px`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'se')}
              title="Resize Corner Bottom-Right"
            />

            {/* Side Handles (N, S, W, E) */}
            <div
              className="absolute cursor-ns-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize * 1.4}px`,
                height: `${handleSize}px`,
                left: '50%',
                top: `-${handleSize / 2}px`,
                transform: 'translateX(-50%)'
              }}
              onPointerDown={(e) => handlePointerDown(e, 'n')}
              title="Resize Top Height"
            />
            <div
              className="absolute cursor-ns-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize * 1.4}px`,
                height: `${handleSize}px`,
                left: '50%',
                bottom: `-${handleSize / 2}px`,
                transform: 'translateX(-50%)'
              }}
              onPointerDown={(e) => handlePointerDown(e, 's')}
              title="Resize Bottom Height"
            />
            <div
              className="absolute cursor-ew-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize * 1.4}px`,
                left: `-${handleSize / 2}px`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
              onPointerDown={(e) => handlePointerDown(e, 'w')}
              title="Resize Left Width"
            />
            <div
              className="absolute cursor-ew-resize bg-white border-2 border-sky-500 rounded-sm shadow-md touch-none"
              style={{
                width: `${handleSize}px`,
                height: `${handleSize * 1.4}px`,
                right: `-${handleSize / 2}px`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
              onPointerDown={(e) => handlePointerDown(e, 'e')}
              title="Resize Right Width"
            />
          </div>
        )}

        {/* Selected Layer Badge (Status Indicator) */}
        {selectedLayer && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-200 backdrop-blur-sm pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold">{selectedLayer.name}</span>
            {selectedLayer.locked && <Lock className="w-3 h-3 text-amber-400" />}
            {!selectedLayer.visible && <EyeOff className="w-3 h-3 text-rose-400" />}
            {selectedLayer.muted && <VolumeX className="w-3 h-3 text-slate-400" />}
          </div>
        )}
      </div>
    </div>
  );
};
