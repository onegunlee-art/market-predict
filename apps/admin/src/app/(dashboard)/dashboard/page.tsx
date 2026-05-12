'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@market-predict/ui';
import { Users, TrendingUp, Layers, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

async function fetchDashboardStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboardStats,
  });

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Market Predict Admin</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats?.users?.total?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users?.newToday || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats?.markets?.active?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.markets?.pendingReview || 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? '-'
                : `₩${(stats?.trades?.volume24h || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.trades?.total || 0} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : stats?.content?.total?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.content?.pendingReview || 0} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will be displayed here
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Top markets will be displayed here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
