
'use client';
import { useEffect, useState } from 'react';
import { HOUR_HEIGHT } from '@/lib/constants';
import { useTimeBubbles } from '@/context/time-bubbles-context';

export function CurrentTimeIndicator() {
  const [topPosition, setTopPosition] = useState(0);
  const { zoomLevel } = useTimeBubbles();

  useEffect(() => {
    const pixelsPerMinute = (HOUR_HEIGHT * zoomLevel) / 60;
    const updatePosition = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setTopPosition(minutes * pixelsPerMinute);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [zoomLevel]);

  return (
    <div
      className="absolute w-full flex items-center z-30 pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
      <div className="flex-1 h-[2px] bg-red-500"></div>
    </div>
  );
}
