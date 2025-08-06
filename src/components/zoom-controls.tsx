
'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Slider } from './ui/slider';
import { MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';

export function ZoomControls() {
  const { zoomLevel, setZoomLevel } = useTimeBubbles();
  return (
    <div className="flex items-center gap-2 w-32">
      <Button variant="ghost" size="icon" onClick={() => setZoomLevel(zoomLevel - 0.2)}>
        <ZoomOut className="h-5 w-5" />
        <span className="sr-only">Zoom Out</span>
      </Button>
      <Slider
        value={[zoomLevel]}
        onValueChange={(value) => setZoomLevel(value[0])}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.1}
      />
      <Button variant="ghost" size="icon" onClick={() => setZoomLevel(zoomLevel + 0.2)}>
        <ZoomIn className="h-5 w-5" />
        <span className="sr-only">Zoom In</span>
      </Button>
    </div>
  );
}
