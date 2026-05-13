# Vercel 배포 가이드 (Market Predict)

이 문서는 **web**과 **admin** 앱을 Vercel에 배포하기 위한 가이드입니다.

## 사전 준비

1. [Vercel 계정](https://vercel.com) 생성
2. GitHub 저장소 `onegunlee-art/market-predict` 연결 권한
3. (선택) Vercel CLI 설치: `npm i -g vercel`

## 배포 방법

### 방법 1: Vercel 대시보드 (권장)

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **"Add New Project"** 클릭
3. GitHub 저장소 `onegunlee-art/market-predict` 선택
4. **Root Directory** 설정:
   - web 앱: `apps/web`
   - admin 앱: `apps/admin`
5. Framework Preset: **Next.js** (자동 감지됨)
6. 환경변수 설정 (아래 참고)
7. **Deploy** 클릭

### 방법 2: Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 토큰으로 로그인 (비대화형)
export VERCEL_TOKEN="your-token-here"

# web 배포
cd apps/web
vercel --token $VERCEL_TOKEN --prod

# admin 배포
cd ../admin
vercel --token $VERCEL_TOKEN --prod
```

## 환경변수 설정

### web (`apps/web`)

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `NEXT_PUBLIC_API_URL` | 예 | API 서버 URL | `https://api.example.com` 또는 로컬 테스트 시 빈 값 |
| `NEXT_PUBLIC_REALTIME_URL` | 예 | WebSocket 서버 URL | `wss://realtime.example.com` 또는 로컬 테스트 시 빈 값 |

### admin (`apps/admin`)

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `NEXT_PUBLIC_API_URL` | 예 | API 서버 URL | `https://api.example.com` |
| `NEXT_PUBLIC_REALTIME_URL` | 예 | WebSocket 서버 URL | `wss://realtime.example.com` |

## 파일럿 테스트 시 환경변수

API 서버가 아직 배포되지 않은 파일럿 단계에서는:

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_REALTIME_URL=
```

빈 값으로 두면 앱은 정적 UI만 표시하고, API 호출은 실패합니다.
이후 API 서버 배포 후 실제 URL로 업데이트하면 됩니다.

## 프로젝트 구조

```
Vercel 프로젝트 2개 생성:
├── market-predict-web     (Root: apps/web)
└── market-predict-admin   (Root: apps/admin)
```

## 빌드 설정

각 앱의 `vercel.json`에 이미 설정되어 있습니다:

- **Install Command**: `cd ../.. && pnpm install`
- **Build Command**: `cd ../.. && pnpm turbo run build --filter=@market-predict/<app>`
- **Output Directory**: `.next`

모노레포 루트에서 의존성을 설치하고 Turborepo로 해당 앱만 빌드합니다.

## 문제 해결

### "Module not found: @market-predict/ui"

빌드 명령이 모노레포 루트에서 실행되는지 확인하세요.
Vercel 대시보드에서 Build Command가 `vercel.json`과 충돌하면,
대시보드의 커스텀 설정을 비우거나 동일하게 맞추세요.

### 환경변수가 적용되지 않음

`NEXT_PUBLIC_` 접두사가 있는 변수는 **빌드 시점**에 번들됩니다.
환경변수 변경 후 반드시 **Redeploy**하세요.

## 다음 단계

1. **API 서버 배포**: Render, Fly.io, 또는 Railway 사용
2. **Supabase 연동**: DATABASE_URL을 API 서버에 설정
3. **환경변수 업데이트**: 실제 API URL로 web/admin 재배포

## 참고 링크

- [Vercel CLI 문서](https://vercel.com/docs/cli)
- [Vercel 모노레포 가이드](https://vercel.com/docs/monorepos)
- [프로젝트 환경변수 템플릿](.env.example)
