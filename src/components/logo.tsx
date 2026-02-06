import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="R & W Property Solutions Logo"
      {...props}
    >
      {/* Black background */}
      <rect width="100" height="100" fill="black" />
      
      {/* House shape path */}
      <path d="M50 10 L5 45 L5 90 L95 90 L95 45 Z" fill="black" stroke="black" strokeWidth="2"/>

      {/* Left white panel */}
      <path d="M50 10 L5 45 L5 90 L50 90 Z" fill="white" />
      
      {/* Right blue panel */}
      <path d="M50 10 L95 45 L95 90 L50 90 Z" fill="hsl(var(--primary))" />
      
      {/* Text R */}
      <text
        x="27"
        y="68"
        fontFamily="sans-serif"
        fontSize="32"
        fontWeight="600"
        fill="black"
        textAnchor="middle"
      >
        R
      </text>
      
      {/* Text W */}
      <text
        x="73"
        y="68"
        fontFamily="sans-serif"
        fontSize="32"
        fontWeight="600"
        fill="black"
        textAnchor="middle"
      >
        W
      </text>

      {/* Text & */}
       <text
        x="50"
        y="83"
        fontFamily="serif"
        fontSize="20"
        fill="black"
        textAnchor="middle"
      >
        &amp;
      </text>

       {/* Center dividing line */}
      <line x1="50" y1="10" x2="50" y2="90" stroke="black" strokeWidth="1.5" />
    </svg>
  );
}
