'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  totalStars?: number;
}

export function Rating({ rating, onRatingChange, totalStars = 5 }: RatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(totalStars)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              className="hidden"
              value={ratingValue}
              onClick={() => onRatingChange(ratingValue)}
            />
            <Star
              className={cn(
                'h-8 w-8 cursor-pointer transition-colors',
                ratingValue <= (hover || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground'
              )}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            />
          </label>
        );
      })}
    </div>
  );
}
