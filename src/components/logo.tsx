import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 90"
      aria-label="R & W Property Solutions Logo"
      {...props}
    >
      <path
        d="M50 0 L0 40 L10 40 L10 90 L50 90 Z"
        className="fill-card stroke-foreground"
        strokeWidth="1"
      />
      <path
        d="M50 0 L100 40 L90 40 L90 90 L50 90 Z"
        className="fill-primary stroke-foreground"
        strokeWidth="1"
      />
      <text
        x="25"
        y="72"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="38"
        fontWeight="bold"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        R
      </text>
      <text
        x="75"
        y="72"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="38"
        fontWeight="bold"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        W
      </text>
      <text
        x="50"
        y="72"
        fontFamily="serif"
        fontSize="42"
        fontWeight="bold"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        &
      </text>
    </svg>
  );
}
