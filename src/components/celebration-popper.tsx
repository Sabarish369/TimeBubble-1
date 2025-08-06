
'use client';

import { useEffect, useState } from 'react';

const colors = ['#ff5733', '#33ff57', '#3357ff', '#ff33a1', '#a133ff', '#33fff6'];
const confettiCount = 50;

export function CelebrationPopper() {
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    const newConfetti = Array.from({ length: confettiCount }, (_, i) => {
      const angle = Math.random() * 360;
      const radius = Math.random() * 50 + 50; // 50-100% of half the container width
      
      const x = 50 + Math.cos(angle * Math.PI / 180) * radius;
      const y = 50 + Math.sin(angle * Math.PI / 180) * radius;
      
      return {
        id: i,
        style: {
          left: `${x}%`,
          top: `${y}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          transform: `translate(-50%, -50%) scale(${Math.random() * 0.5 + 0.5})`,
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${Math.random() * 0.5 + 0.5}s`
        }
      };
    });
    setConfetti(newConfetti);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {confetti.map((c) => (
        <div key={c.id} className="confetti" style={c.style} />
      ))}
    </div>
  );
}

// Basic animation in globals.css, more complex animation can be done with keyframes
const keyframes = `
@keyframes confetti-pop {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.5) rotate(360deg);
    opacity: 0;
  }
}
.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation-name: confetti-pop;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}
`;

// Inject keyframes into the document head
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}
