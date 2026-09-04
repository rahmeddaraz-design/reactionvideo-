/**
 * Layout Presets for Ahmed Reaction Studio
 * Resolution-independent normalized coordinates (0.0 - 1.0)
 * Works adaptively on 16:9, 9:16, and 1:1 canvases
 */

import { CanvasAspectRatio, NormalizedGeometry, PresetLayout } from '../types';

export const STUDIO_PRESETS: PresetLayout[] = [
  {
    id: 'bottom-right',
    name: 'Bottom Right',
    iconName: 'corner-down-right',
    description: 'Classic PiP commentator corner position',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        // Portrait mobile: taller width percentage
        return { x: 0.58, y: 0.72, w: 0.38, h: 0.24 };
      }
      return { x: 0.70, y: 0.68, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'bottom-left',
    name: 'Bottom Left',
    iconName: 'corner-down-left',
    description: 'Bottom left commentary view',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.04, y: 0.72, w: 0.38, h: 0.24 };
      }
      return { x: 0.03, y: 0.68, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'top-right',
    name: 'Top Right',
    iconName: 'corner-up-right',
    description: 'Top right corner overlay',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.58, y: 0.04, w: 0.38, h: 0.24 };
      }
      return { x: 0.70, y: 0.04, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'top-left',
    name: 'Top Left',
    iconName: 'corner-up-left',
    description: 'Top left corner overlay',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.04, y: 0.04, w: 0.38, h: 0.24 };
      }
      return { x: 0.03, y: 0.04, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'bottom-center',
    name: 'Bottom Center',
    iconName: 'arrow-down',
    description: 'Centered commentator at bottom',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.25, y: 0.72, w: 0.50, h: 0.24 };
      }
      return { x: 0.35, y: 0.68, w: 0.30, h: 0.28 };
    }
  },
  {
    id: 'top-center',
    name: 'Top Center',
    iconName: 'arrow-up',
    description: 'Centered overlay at top',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.25, y: 0.04, w: 0.50, h: 0.24 };
      }
      return { x: 0.35, y: 0.04, w: 0.30, h: 0.28 };
    }
  },
  {
    id: 'center-right',
    name: 'Center Right',
    iconName: 'arrow-right',
    description: 'Right edge middle anchor',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.58, y: 0.38, w: 0.38, h: 0.24 };
      }
      return { x: 0.70, y: 0.36, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'center-left',
    name: 'Center Left',
    iconName: 'arrow-left',
    description: 'Left edge middle anchor',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.04, y: 0.38, w: 0.38, h: 0.24 };
      }
      return { x: 0.03, y: 0.36, w: 0.27, h: 0.28 };
    }
  },
  {
    id: 'center',
    name: 'True Center',
    iconName: 'crosshair',
    description: 'Dead center overlay',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.15, y: 0.32, w: 0.70, h: 0.36 };
      }
      return { x: 0.25, y: 0.25, w: 0.50, h: 0.50 };
    }
  },
  {
    id: 'split-50-50',
    name: '50 / 50 Split',
    iconName: 'columns-2',
    description: 'Equal split screen comparison',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        // In vertical format, 50/50 splits top and bottom
        return { x: 0.0, y: 0.50, w: 1.0, h: 0.50 };
      }
      // Landscape format: side by side (right half)
      return { x: 0.50, y: 0.0, w: 0.50, h: 1.0 };
    }
  },
  {
    id: 'split-70-30',
    name: '70 / 30 Focus',
    iconName: 'panel-right',
    description: 'Dominant main content with 30% side strip',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.0, y: 0.68, w: 1.0, h: 0.32 };
      }
      return { x: 0.68, y: 0.0, w: 0.32, h: 1.0 };
    }
  },
  {
    id: 'quarter',
    name: 'Quarter Screen',
    iconName: 'grid-2x2',
    description: 'Exact 25% quadrant (bottom right)',
    getGeometry: () => {
      return { x: 0.50, y: 0.50, w: 0.50, h: 0.50 };
    }
  },
  {
    id: 'full-screen',
    name: 'Full Screen',
    iconName: 'maximize',
    description: 'Covers entire canvas (100% width & height)',
    getGeometry: () => {
      return { x: 0.0, y: 0.0, w: 1.0, h: 1.0 };
    }
  },
  {
    id: 'bottom-third',
    name: 'Lower Third Bar',
    iconName: 'minus',
    description: 'Lower third strip across the bottom',
    getGeometry: (aspect) => {
      if (aspect === '9:16') {
        return { x: 0.05, y: 0.82, w: 0.90, h: 0.15 };
      }
      return { x: 0.08, y: 0.78, w: 0.84, h: 0.18 };
    }
  }
];

export function snapGeometry(
  geom: NormalizedGeometry, 
  threshold: number = 0.02
): { snapped: NormalizedGeometry; guides: { x?: number; y?: number } } {
  const result = { ...geom };
  const guides: { x?: number; y?: number } = {};

  // Snap X to left edge (0.0)
  if (Math.abs(result.x) < threshold) {
    result.x = 0;
    guides.x = 0;
  }
  // Snap right edge to right boundary (1.0)
  else if (Math.abs(result.x + result.w - 1.0) < threshold) {
    result.x = 1.0 - result.w;
    guides.x = 1.0;
  }
  // Snap center to canvas center (0.5)
  else if (Math.abs(result.x + result.w / 2 - 0.5) < threshold) {
    result.x = 0.5 - result.w / 2;
    guides.x = 0.5;
  }

  // Snap Y to top edge (0.0)
  if (Math.abs(result.y) < threshold) {
    result.y = 0;
    guides.y = 0;
  }
  // Snap bottom edge to bottom boundary (1.0)
  else if (Math.abs(result.y + result.h - 1.0) < threshold) {
    result.y = 1.0 - result.h;
    guides.y = 1.0;
  }
  // Snap vertical center to canvas center (0.5)
  else if (Math.abs(result.y + result.h / 2 - 0.5) < threshold) {
    result.y = 0.5 - result.h / 2;
    guides.y = 0.5;
  }

  return { snapped: result, guides };
}
