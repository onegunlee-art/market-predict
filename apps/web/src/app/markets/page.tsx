'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, Badge, Skeleton } from '@market-predict/ui';
import { TrendingUp, ArrowLeft, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MarketCard } from '@/components/market-card';

const categories = [
  { value: 'all', label: '전체' },
  { value: 'KPOP', label: 'K-POP' },
  { value: 'MOVIE', label: '영화' },
  { value: 'DRAMA', label: '드라마' },
  { value: 'TV_SHOW', label: 'TV' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'VIRAL', label: '바이럴' },
];

async function fetchMarkets(category: string) {
  const params = new URLSearchParams({ status: 'ACTIVE' });
  if (category !== 'all') {
    params.append('category', category);
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/markets?${params}`);
  if (!res.ok) throw new Error('Failed to fetch markets');
  return res.json();
}

export default function MarketsPage() {
  const [category, setCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['markets', category],
    queryFn: () => fetchMarkets(category),
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">마켓</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            필터
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={category} onValueChange={setCategory} className="mb-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="mb-4 h-32 w-full" />
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((market: any) => (
              <Link key={market.id} href={`/markets/${market.id}`}>
                <MarketCard
                  id={market.id}
                  question={market.question}
                  probability={Number(market.probability)}
                  category={market.category}
                  imageUrl={market.content?.imageUrl}
                  closesAt={new Date(market.closesAt)}
                  volume={Number(market.volume)}
                  tradeCount={market._count?.trades || 0}
                />
              </Link>
            ))}
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>해당 카테고리에 활성화된 마켓이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
