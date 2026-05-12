import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../button';

interface TradeSideButtonProps {
  side: 'YES' | 'NO';
  probability: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TradeSideButton({
  side,
  probability,
  selected = false,
  disabled = false,
  onClick,
  className,
}: TradeSideButtonProps) {
  const isYes = side === 'YES';
  const percentage = Math.round(probability * 100);

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <Button
        variant={isYes ? 'yes' : 'no'}
        size="xl"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'relative w-full overflow-hidden',
          selected && 'ring-2 ring-offset-2',
          selected && isYes && 'ring-yes',
          selected && !isYes && 'ring-no',
          className
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-lg font-bold">{side}</span>
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>

        {/* Background fill animation */}
        <motion.div
          className={cn(
            'absolute inset-0 -z-10',
            isYes ? 'bg-yes/20' : 'bg-no/20'
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </Button>
    </motion.div>
  );
}
