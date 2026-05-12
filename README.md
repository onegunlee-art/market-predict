# Market Predict

> A realtime cultural prediction exchange where crowd sentiment becomes market probability.

## Overview

Market Predict is a production-grade global cultural prediction market platform. Users can trade on the outcomes of cultural events across K-POP, Movies, Drama, TV shows, Beauty products, and viral internet trends.

**This is NOT a casino or gambling site.** This is:
- A prediction market
- A cultural forecasting engine
- A crowd-intelligence system
- A realtime probability platform

## Features

- **YES/NO Prediction Markets** - Trade on binary outcomes
- **AI-Generated Priors** - Machine learning sets initial probabilities
- **LMSR Market Maker** - Automated liquidity via Logarithmic Market Scoring Rule
- **Realtime Updates** - WebSocket-based live probability changes
- **Reputation System** - Track prediction accuracy over time
- **Admin Dashboard** - Full content management and moderation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, TailwindCSS, shadcn/ui |
| Backend | Fastify, TypeScript |
| Realtime | WebSocket, Redis Pub/Sub |
| AI Engine | Python FastAPI, LightGBM |
| Database | PostgreSQL, Prisma |
| Infrastructure | Docker, NGINX |

## Monorepo Structure

```
market-predict/
├── apps/
│   ├── web/           # Consumer-facing app
│   ├── admin/         # Admin dashboard
│   ├── api/           # REST API server
│   ├── realtime/      # WebSocket server
│   └── ai-engine/     # Python ML service
├── packages/
│   ├── ui/            # Shared components
│   ├── shared-types/  # TypeScript types
│   ├── market-engine/ # LMSR logic
│   ├── utils/         # Utilities
│   ├── database/      # Prisma schema
│   └── config/        # Shared configs
└── infrastructure/
    ├── docker/        # Dockerfiles
    └── nginx/         # NGINX configs
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Python 3.11+ (for AI engine)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/market-predict.git
cd market-predict

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start databases
docker-compose up -d postgres redis

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start development servers
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Start web app only
pnpm dev:admin        # Start admin app only
pnpm dev:api          # Start API server only

# Build
pnpm build            # Build all packages
pnpm build:web        # Build web app

# Database
pnpm db:migrate       # Run migrations
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # E2E tests

# Linting
pnpm lint             # Lint all packages
pnpm format           # Format code
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Product Philosophy

See [PRODUCT.md](./PRODUCT.md) for product vision and UX principles.

## API Documentation

API documentation is available at `http://localhost:4000/docs` when running the development server.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

## License

This project is proprietary software. All rights reserved.

## Contact

For questions or support, contact the development team.
