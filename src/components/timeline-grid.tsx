'use client';
import { HOUR_HEIGHT, TOTAL_HOURS } from '@/lib/constants';

export function TimelineGrid() {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hours.map(hour => (
        <div
          key={hour}
          className="relative"
          style={{ height: `${HOUR_HEIGHT}px` }}
        >
          <div className="absolute -left-16 top-[-0.8em] text-base text-muted-foreground w-14 text-right pr-2">
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
          </div>
          <div className="h-full border-t border-border/60"></div>
        </div>
      ))}
    </div>
  );
}
