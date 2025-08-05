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
      <g clipPath="url(#clip0_10_2)">
        <circle cx="12" cy="12" r="10" className="fill-primary/70" />
        <circle cx="28" cy="12" r="6" className="fill-accent/80" />
        <text
          x="42"
          y="17"
          fontFamily="'Inter', sans-serif"
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
