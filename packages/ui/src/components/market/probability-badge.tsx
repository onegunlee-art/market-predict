import * as React from 'react';
import { cn } from '../../lib/utils';

interface ProbabilityBadgeProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  change?: number;
  className?: string;
}

export function ProbabilityBadge({
  probability,
  size = 'md',
  showChange = false,
  change = 0,
  className,
}: ProbabilityBadgeProps) {
  const percentage = Math.round(probability * 100);
  const isPositive = change > 0;

  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-2xl font-bold',
    lg: 'text-4xl font-bold',
  };

  const getColorClass = (prob: number) => {
    if (prob >= 0.7) return 'text-yes';
    if (prob >= 0.5) return 'text-yellow-500';
    if (prob >= 0.3) return 'text-orange-500';
    return 'text-no';
  };

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn(sizeClasses[size], getColorClass(probability))}>
        {percentage}%
      </span>
      {showChange && change !== 0 && (
        <span
          className={cn(
            'text-sm font-medium',
            isPositive ? 'text-yes' : 'text-no'
          )}
        >
          {isPositive ? '+' : ''}
          {(change * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
}
