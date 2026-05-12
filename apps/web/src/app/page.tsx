import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@market-predict/ui';
import { TrendingUp, Zap, Brain, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Market Predict</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/markets">
              <Button variant="ghost">Markets</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight">
              문화를 예측하고
              <br />
              <span className="text-primary">집단 지성</span>에 참여하세요
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              K-POP, 영화, 드라마, 뷰티 트렌드까지.
              AI와 군중의 지혜가 만나 실시간으로 변화하는 확률을 거래하세요.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/markets">
                <Button size="lg">마켓 둘러보기</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <Zap className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>실시간 확률</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    거래가 일어날 때마다 실시간으로 확률이 변화합니다.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Brain className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>AI 예측</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    머신러닝 모델이 초기 확률을 예측하고 시장이 검증합니다.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>집단 지성</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    수천 명의 예측이 모여 가장 정확한 확률을 만듭니다.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>LMSR 시장</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    수학적으로 검증된 마켓 메이커가 유동성을 보장합니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">지금 바로 시작하세요</h2>
            <p className="mb-8 text-muted-foreground">
              가입하고 10,000 포인트를 받아 예측을 시작하세요.
            </p>
            <Link href="/register">
              <Button size="lg">무료로 가입하기</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Market Predict. All rights reserved.</p>
          <p className="mt-2">
            이 플랫폼은 예측 시장이며, 도박 사이트가 아닙니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
