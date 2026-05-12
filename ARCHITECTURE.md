# Architecture Documentation

## System Overview

Market Predict is a realtime cultural prediction exchange platform built with a microservices architecture. The system consists of multiple services communicating through REST APIs and WebSocket connections, with Redis serving as the message broker for realtime updates.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│    Web App      │   Admin App     │    Mobile (Future)          │
│   (Next.js)     │   (Next.js)     │                             │
└────────┬────────┴────────┬────────┴─────────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX Load Balancer                          │
└────────┬────────────────────────────────────┬───────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│    API Server       │            │  Realtime Server    │
│    (Fastify)        │            │   (WebSocket)       │
└────────┬────────────┘            └──────────┬──────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis                                    │
│              (Cache / Pub-Sub / Sessions)                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
│                    (Primary Database)                           │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Engine                                   │
│                  (Python FastAPI)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Service Architecture

### 1. Web App (`apps/web`)

Consumer-facing Next.js application.

**Responsibilities:**
- Market discovery and browsing
- Trading interface
- User portfolio management
- Social features

**Key Technologies:**
- Next.js 14+ with App Router
- React Server Components
- TailwindCSS + shadcn/ui
- Zustand for client state
- React Query for server state
- Framer Motion for animations

### 2. Admin App (`apps/admin`)

Internal administration dashboard.

**Responsibilities:**
- User management
- Market creation and resolution
- Content ingestion
- Moderation workflows
- Analytics dashboard
- System configuration

**Key Technologies:**
- Next.js 14+ with App Router
- Role-based access control
- Dynamic menu system
- Recharts for analytics

### 3. API Server (`apps/api`)

Primary REST API backend.

**Responsibilities:**
- Authentication (JWT, OAuth)
- User management
- Market CRUD operations
- Trade execution
- Content management
- Admin operations

**Key Technologies:**
- Fastify with TypeScript
- Prisma ORM
- Zod validation
- JWT authentication

**Endpoints Structure:**
```
/api/v1
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET  /kakao/callback
├── /users
│   ├── GET  /me
│   ├── PATCH /me
│   └── GET  /:id
├── /markets
│   ├── GET  /
│   ├── GET  /:id
│   ├── POST /
│   ├── PATCH /:id
│   └── POST /:id/resolve
├── /trades
│   ├── POST /
│   ├── GET  /my
│   └── GET  /market/:id
├── /content
│   ├── GET  /
│   ├── POST /ingest
│   └── PATCH /:id
└── /admin
    ├── /users
    ├── /markets
    ├── /moderation
    └── /analytics
```

### 4. Realtime Server (`apps/realtime`)

WebSocket server for live updates.

**Responsibilities:**
- WebSocket connection management
- Market probability broadcasts
- Trade notifications
- User activity streaming

**Key Technologies:**
- Node.js with ws library
- Redis Pub/Sub
- JWT authentication for connections

**Channel Structure:**
```
market:{marketId}     - Individual market updates
markets:trending      - Trending markets feed
markets:category:{c}  - Category-specific feeds
user:{userId}         - Personal notifications
admin:alerts          - Admin realtime alerts
```

### 5. AI Engine (`apps/ai-engine`)

Machine learning microservice.

**Responsibilities:**
- Prior probability generation
- Sentiment analysis
- Feature engineering
- Trend detection
- Model inference

**Key Technologies:**
- Python FastAPI
- Pandas, NumPy
- LightGBM
- PyTorch (optional)

## Database Schema

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Trade     │>────│   Market    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│  Position   │                        │   Content   │
└─────────────┘                        └─────────────┘
                                             │
                                             ▼
                                       ┌─────────────┐
                                       │  AIPrior    │
                                       └─────────────┘
```

### Key Tables

**users**
- id, email, kakao_id, auth_provider
- balance, reputation_score
- role_id, created_at, updated_at

**markets**
- id, content_id, question
- probability, liquidity_param
- yes_shares, no_shares
- status, resolution_time, outcome

**trades**
- id, user_id, market_id
- side (YES/NO), shares, cost
- probability_after, created_at

**content**
- id, title, description, image_url
- category, metadata (JSONB)
- status, created_at

**ai_priors**
- id, market_id
- probability, confidence
- features (JSONB), generated_at

### Admin Tables

- roles, permissions, role_permissions
- menu_items, menu_config
- content_sources, ingestion_jobs
- moderation_logs, audit_logs
- notifications, announcements

## Market Engine

### LMSR (Logarithmic Market Scoring Rule)

The market uses LMSR for automated market making:

**Cost Function:**
```
C(q) = b × ln(e^(q_yes/b) + e^(q_no/b))
```

**Price Function:**
```
p_yes = e^(q_yes/b) / (e^(q_yes/b) + e^(q_no/b))
```

Where:
- `q_yes`, `q_no` = outstanding shares
- `b` = liquidity parameter
- Higher `b` = more liquid market, smaller price impact

### Probability Update Flow

1. **AI Prior Generation**
   - AI engine analyzes data sources
   - Generates initial probability with confidence

2. **Market Opening**
   - Market opens with AI prior as starting probability
   - Initial shares set based on prior

3. **Trading**
   - Users buy YES or NO shares
   - LMSR calculates cost and new probability
   - Probability updates in realtime

4. **External Events**
   - News/events trigger recalculation
   - AI may adjust prior based on new data

5. **Resolution**
   - Market resolves to YES or NO
   - Winners receive payouts

## Realtime Architecture

### Event Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │    │   WS    │    │  Redis  │    │   API   │
│         │    │ Server  │    │ Pub/Sub │    │ Server  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ Connect      │              │              │
     │─────────────>│              │              │
     │              │ Subscribe    │              │
     │              │─────────────>│              │
     │              │              │              │
     │              │              │  Trade       │
     │              │              │<─────────────│
     │              │              │              │
     │              │   Update     │              │
     │              │<─────────────│              │
     │  Broadcast   │              │              │
     │<─────────────│              │              │
     │              │              │              │
```

### Message Format

```typescript
interface WSMessage {
  type: 'market_update' | 'trade' | 'notification' | 'ai_signal';
  payload: {
    marketId?: string;
    probability?: number;
    volume?: number;
    timestamp: string;
    // ... type-specific fields
  };
}
```

## Content Ingestion Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  URL    │───>│ Detect  │───>│ Scrape  │───>│Normalize│
│ Input   │    │ Source  │    │ Content │    │  Data   │
└─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Market  │<───│ Admin   │<───│  Queue  │<───│ Process │
│ Ready   │    │ Review  │    │         │    │ & Tag   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Supported Sources

**Phase 1:**
- TMDB (movies, TV shows)
- YouTube (videos, trailers)
- Manual entry

**Future:**
- Spotify
- TikTok
- IMDb
- Amazon
- Olive Young

## Security

### Authentication

- JWT tokens with short expiration (15 min)
- Refresh tokens with longer expiration (30 days)
- OAuth integration (Kakao, future: Google)

### Authorization

- Role-based access control (RBAC)
- Permission-based granular access
- API key authentication for services

### Data Protection

- Input validation with Zod
- Parameterized queries via Prisma
- Rate limiting on API endpoints
- CORS configuration

## Monitoring & Observability

### Logging

- Structured JSON logs
- Log levels: debug, info, warn, error
- Request/response logging
- Error tracking with stack traces

### Metrics

- Request latency
- Error rates
- Database query performance
- WebSocket connection count
- Market trading volume

### Alerting

- Error rate thresholds
- Performance degradation
- Fraud detection alerts
- System health checks

## Deployment

### Environments

- **Development**: Local Docker Compose
- **Staging**: Cloud infrastructure mirror
- **Production**: Full cloud deployment

### Docker Compose Services

```yaml
services:
  - web           # Next.js consumer app
  - admin         # Next.js admin app
  - api           # Fastify API server
  - realtime      # WebSocket server
  - ai-engine     # Python FastAPI
  - postgres      # PostgreSQL database
  - redis         # Redis cache/pub-sub
  - nginx         # Load balancer/proxy
```

## Scaling Considerations

### Horizontal Scaling

- Stateless API servers behind load balancer
- WebSocket servers with sticky sessions
- Read replicas for database
- Redis cluster for pub/sub

### Vertical Scaling

- Database connection pooling
- Query optimization
- Caching strategies
- AI model optimization

### Future Considerations

- Kubernetes deployment
- CDN for static assets
- Message queue for async tasks
- Event sourcing for audit trail
