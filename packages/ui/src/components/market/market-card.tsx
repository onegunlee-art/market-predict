import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../card';
import { Badge } from '../badge';
import { ProbabilityBadge } from './probability-badge';

interface MarketCardProps {
  id: string;
  question: string;
  probability: number;
  priceChange24h?: number;
  volume?: number;
  tradeCount?: number;
  category: string;
  imageUrl?: string;
  closesAt: Date;
  aiPrior?: number;
  onClick?: () => void;
  className?: string;
}

export function MarketCard({
  question,
  probability,
  priceChange24h = 0,
  volume = 0,
  tradeCount = 0,
  category,
  imageUrl,
  closesAt,
  aiPrior,
  onClick,
  className,
}: MarketCardProps) {
  const timeRemaining = getTimeRemaining(closesAt);
  const isTrending = Math.abs(priceChange24h) > 0.05;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer overflow-hidden transition-shadow hover:shadow-lg',
          className
        )}
        onClick={onClick}
      >
        {imageUrl && (
          <div className="relative h-32 w-full overflow-hidden">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Badge className="absolute right-2 top-2" variant="secondary">
              {category}
            </Badge>
          </div>
        )}
        <CardContent className={cn('p-4', !imageUrl && 'pt-4')}>
          {!imageUrl && (
            <Badge className="mb-2" variant="secondary">
              {category}
            </Badge>
          )}

          <h3 className="mb-3 line-clamp-2 text-sm font-medium leading-tight">
            {question}
          </h3>

          <div className="flex items-center justify-between">
            <ProbabilityBadge
              probability={probability}
              size="md"
              showChange={isTrending}
              change={priceChange24h}
            />

            {aiPrior !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium">AI</span>
                <span>{Math.round(aiPrior * 100)}%</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {isTrending && (
                <span className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tradeCount}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getTimeRemaining(closesAt: Date): string {
  const now = new Date();
  const diff = closesAt.getTime() - now.getTime();

  if (diff <= 0) return '종료됨';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}일 남음`;
  if (hours > 0) return `${hours}시간 남음`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}분 남음`;
}
