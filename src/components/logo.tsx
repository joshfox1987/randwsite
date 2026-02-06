import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-2 -2 104 94"
      aria-label="R & W Property Solutions Logo"
      {...props}
    >
      <g stroke="black" strokeWidth="1">
        <path d="M50 0 L0 40 L0 90 L50 90 L50 0 Z" fill="white" />
        <path
          d="M50 0 L100 40 L100 90 L50 90 L50 0 Z"
          className="fill-primary"
        />
      </g>
      <text
        x="25"
        y="65"
        fontFamily="sans-serif"
        fontSize="36"
        fontWeight="bold"
        fill="black"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        R
      </text>
      <text
        x="38"
        y="82"
        fontFamily="sans-serif"
        fontSize="22"
        fontWeight="bold"
        fill="black"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        &
      </text>
      <text
        x="75"
        y="65"
        fontFamily="sans-serif"
        fontSize="42"
        fontWeight="bold"
        fill="black"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        W
      </text>
    </svg>
  );
}
