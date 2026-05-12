'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, Badge } from '@market-predict/ui';
import { Clock, Users } from 'lucide-react';
import { formatTimeRemaining } from '@market-predict/utils';

interface MarketCardProps {
  id: string;
  question: string;
  probability: number;
  category: string;
  imageUrl?: string | null;
  closesAt: Date;
  volume?: number;
  tradeCount?: number;
}

const categoryLabels: Record<string, string> = {
  KPOP: 'K-POP',
  MOVIE: '영화',
  DRAMA: '드라마',
  TV_SHOW: 'TV',
  BEAUTY: '뷰티',
  CONSUMER: '소비재',
  VIRAL: '바이럴',
};

export function MarketCard({
  question,
  probability,
  category,
  imageUrl,
  closesAt,
  tradeCount = 0,
}: MarketCardProps) {
  const percentage = Math.round(probability * 100);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'text-yes';
    if (prob >= 0.5) return 'text-yellow-500';
    if (prob >= 0.3) return 'text-orange-500';
    return 'text-no';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
        {imageUrl && (
          <div className="relative h-32 w-full overflow-hidden">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <Badge className="absolute right-2 top-2" variant="secondary">
              {categoryLabels[category] || category}
            </Badge>
          </div>
        )}
        <CardContent className={`p-4 ${!imageUrl ? 'pt-4' : ''}`}>
          {!imageUrl && (
            <Badge className="mb-2" variant="secondary">
              {categoryLabels[category] || category}
            </Badge>
          )}

          <h3 className="mb-3 line-clamp-2 text-sm font-medium leading-tight">
            {question}
          </h3>

          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${getProbabilityColor(probability)}`}>
              {percentage}%
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {tradeCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeRemaining(closesAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
