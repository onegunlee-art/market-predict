# Railway 배포 가이드 (Market Predict)

이 문서는 **Railway 프로젝트 관리자**(다른 개발자 계정)가 GitHub 모노레포를 기준으로 전체 서비스를 배포할 때 사용합니다.  
**GitHub**는 코드의 단일 소스이며, **Supabase**의 `DATABASE_URL`은 DB 소유자(팀원)가 생성해 공유합니다.

## 사전 준비

1. Railway에서 **GitHub 저장소** `onegunlee-art/market-predict` 연결
2. Supabase에서 **Postgres 연결 문자열** 준비 (아래 참고)
3. Railway에서 **Redis** 추가 (플러그인 또는 Redis 템플릿)

## 서비스 생성 순서 (권장)

1. **Redis** — API / Realtime이 Pub·Sub·캐시에 사용
2. **api** — `apps/api` (Root Directory)
3. **realtime** — `apps/realtime` (Root Directory)
4. **web** — `apps/web` (Root Directory), 배포 후 공개 URL 확인
5. **admin** — `apps/admin` (Root Directory, 선택)
6. **ai-engine** — Python 서비스는 별도 가이드(추후) 또는 Railway Docker 권장

각 서비스의 **Root Directory**를 위 경로로 지정하면, 해당 폴더의 `railway.json`이 빌드/시작 명령에 사용됩니다.

## 서비스별 환경 변수

공통: `NODE_ENV=production`

### `web` (`apps/web`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 예 | 배포된 API의 공개 URL (예: `https://api-xxx.up.railway.app`) |
| `NEXT_PUBLIC_REALTIME_URL` | 예 | WebSocket 공개 URL (예: `wss://realtime-xxx.up.railway.app`) |
| `PORT` | 자동 | Railway가 주입. Next `start`가 사용 |

### `admin` (`apps/admin`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 예 | API 공개 URL |
| `NEXT_PUBLIC_REALTIME_URL` | 예 | WebSocket 공개 URL |
| `PORT` | 자동 | Railway 주입 |

### `api` (`apps/api`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `DATABASE_URL` | 예 | Supabase Postgres 연결 문자열 (Prisma 호환) |
| `REDIS_URL` | 예 | Railway Redis 연결 URL |
| `JWT_SECRET` | 예 | 충분히 긴 랜덤 문자열 |
| `CORS_ORIGINS` | 예 | 쉼표로 구분. 예: `https://your-web.up.railway.app,https://your-admin.up.railway.app` |
| `PORT` | 자동 | Railway 주입 (앱은 `process.env.PORT` 사용) |

선택: `JWT_EXPIRES_IN`, `LOG_LEVEL`, `RATE_LIMIT_*` — [.env.example](.env.example) 참고.

### `realtime` (`apps/realtime`)

| 변수 | 필수 | 설명 |
|------|------|------|
| `REDIS_URL` | 예 | Railway Redis |
| `JWT_SECRET` | 예 | **api와 동일**해야 토큰 검증이 맞음 |
| `PORT` | 자동 | Railway 주입 |

## Supabase 연동

1. Supabase 프로젝트 → **Settings → Database**
2. **Connection string** → **URI** (Prisma/Node용) 복사
3. Railway `api` (및 필요 시 `ai-engine`) 서비스에 `DATABASE_URL`로 붙여넣기
4. 비밀번호 등 특수문자는 URL 인코딩 필요할 수 있음

**마이그레이션:** 로컬 또는 CI에서 `pnpm db:push` 또는 `pnpm db:migrate`로 스키마 반영 후 API 배포. (운영은 `migrate deploy` 권장)

## 헬스체크

- API: `GET /health` — [apps/api/src/routes/health.ts](apps/api/src/routes/health.ts)  
- DB 준비 확인: `GET /health/ready` (DB 연결 실패 시 503)

Railway **Healthcheck Path**에는 `/health` 사용.

## CORS / Web URL 정리

1. `web`, `admin` 배포 후 각각의 `https://*.up.railway.app` URL 확보  
2. `api`의 `CORS_ORIGINS`에 위 URL들을 **쉼표로** 넣기  
3. `web` / `admin`의 `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REALTIME_URL`을 실제 배포 URL로 설정

## `railway.json` 위치

| 서비스 | 파일 |
|--------|------|
| API | [apps/api/railway.json](apps/api/railway.json) |
| Realtime | [apps/realtime/railway.json](apps/realtime/railway.json) |
| Web | [apps/web/railway.json](apps/web/railway.json) |
| Admin | [apps/admin/railway.json](apps/admin/railway.json) |

빌드는 저장소 루트로 올라가 `pnpm install` 후 `turbo run build --filter=...`로 워크스페이스 의존성까지 빌드합니다.

## 문제 해결

- **`Module not found: @market-predict/ui`**  
  빌드가 루트에서 `turbo`로 돌아가는지 확인. Dashboard의 Build Command가 `railway.json`과 충돌하면 **Railway UI의 커스텀 Build Command를 비우거나** `railway.json`과 동일하게 맞춤.

- **API 503 on `/health/ready`**  
  `DATABASE_URL`·네트워크·Supabase 방화벽 확인.

- **Realtime 연결 실패**  
  `JWT_SECRET`이 API와 동일한지, 브라우저에서는 `wss://`와 올바른 포트/경로인지 확인.

## 참고

- Railway CLI: [Railway CLI 문서](https://docs.railway.com/cli)
- 환경 변수 템플릿: [.env.example](.env.example)
