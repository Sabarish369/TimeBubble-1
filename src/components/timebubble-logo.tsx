import type { SVGProps } from "react";

export function TimeBubbleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 24"
      fill="none"
      aria-label="TimeBubble Logo"
      {...props}
    >
       <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <g clipPath="url(#clip0_10_2)">
        <circle cx="12" cy="12" r="10" fill="url(#logoGradient)" />
        <text
          x="30"
          y="17"
          fontFamily="'Manrope', sans-serif"
          fontSize="16"
          fontWeight="600"
          className="fill-foreground"
        >
          TimeBubble
        </text>
      </g>
      <defs>
        <clipPath id="clip0_10_2">
          <rect width="140" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
