'use client';
import { HOUR_HEIGHT, TOTAL_HOURS } from '@/lib/constants';

export function TimelineGrid() {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hours.map(hour => (
        <div
          key={hour}
          className="relative"
          style={{ height: `${HOUR_HEIGHT}px` }}
        >
          <div className="absolute -left-20 top-[-0.7em] text-sm font-medium text-muted-foreground w-16 text-right">
            {formatHour(hour)}
          </div>
          <div className="h-full border-t border-border/60 ml-2"></div>
        </div>
      ))}
    </div>
  );
}
