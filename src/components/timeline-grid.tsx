'use client';
import { HOUR_HEIGHT, TOTAL_HOURS, SIDEBAR_WIDTH } from '@/lib/constants';

export function TimelineGrid() {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  return (
    <div className="absolute inset-0 pointer-events-none grid grid-cols-[80px_1fr]">
      {/* Time Gutter */}
      <div className="relative border-r">
        {hours.map(hour => (
          <div
            key={hour}
            className="text-right pr-2"
            style={{ height: `${HOUR_HEIGHT}px` }}
          >
            <span className="relative -top-3 text-sm font-medium text-muted-foreground">
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Grid Lines */}
      <div className="relative">
        {hours.map(hour => (
          <div
            key={hour}
            className="border-t border-border/60"
            style={{ height: `${HOUR_HEIGHT}px` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
