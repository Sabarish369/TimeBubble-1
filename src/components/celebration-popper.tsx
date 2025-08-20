
'use client';

import { useEffect, useState } from 'react';

const CONFETTI_COUNT = 30;

export function CelebrationPopper() {
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    const newConfetti = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * -50 - 50}px`, // Start above the element
        backgroundColor: `hsl(${Math.random() * 360}, 90%, 70%)`,
        animationDelay: `${Math.random() * 1.5}s`,
        animationDuration: `${1 + Math.random()}s`,
        transform: `scale(${Math.random() * 0.5 + 0.5})`,
      },
    }));
    setConfetti(newConfetti);
  }, []);

  return (
    <div className="celebration-popper">
      {confetti.map((c) => (
        <div key={c.id} className="confetti" style={c.style}></div>
      ))}
    </div>
  );
}
