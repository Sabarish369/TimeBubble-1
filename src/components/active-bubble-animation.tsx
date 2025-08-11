
'use client';

export function ActiveBubbleAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="active-bubble"></div>
      <div className="active-bubble"></div>
      <div className="active-bubble"></div>
      <div className="active-bubble"></div>
      <div className="active-bubble"></div>
    </div>
  );
}
