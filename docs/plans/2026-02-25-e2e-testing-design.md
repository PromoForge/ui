# E2E Testing Design

## Goal

Self-contained Playwright E2E tests for PromoForge UI that run against real read APIs — no mocks. A single `make test-e2e` command builds the server from GitHub, starts all dependencies, seeds test data, runs tests, and tears everything down.

## Architecture

```
make test-e2e
    │
    ├─ 1. docker compose up --build -d   (postgres + promoforge server)
    │     └─ Dockerfile: clones promoforge from GitHub main, builds binary
    │     └─ entrypoint: waits for postgres, installs schema, starts server
    ├─ 2. Playwright starts SvelteKit dev server (port 5173)
    ├─ 3. globalSetup seeds test data via API (create application + attributes)
    ├─ 4. Playwright runs tests against real UI + real API
    └─ 5. docker compose down (cleans up containers)
```

### Ports

| Service          | Port  |
|------------------|-------|
| Postgres         | 5433  |
| PromoForge HTTP  | 7243  |
| SvelteKit Dev    | 5174  |

Non-default ports (5433 instead of 5432, 5174 instead of 5173) to avoid colliding with a running dev environment.

## Test Scope

Only pages backed by real APIs:

- **Applications**: list, select, switch between apps
- **Attributes**: list, search, filter (entity/type/visibility), sort, create, update, delete

Mock-backed pages (campaigns, dashboard, app detail) are excluded until their services connect to real APIs.

## File Layout

```
e2e/
├── docker-compose.yml          # Postgres + promoforge server
├── Dockerfile.server           # Multi-stage: clone → build → run
├── entrypoint.sh               # Wait for postgres, install schema, start server
├── playwright.config.ts        # Playwright config
├── global-setup.ts             # Seed test data via API
├── global-teardown.ts          # Clean up test data (optional since containers are destroyed)
├── tests/
│   ├── applications.spec.ts    # Application list & selection tests
│   └── attributes.spec.ts     # Attribute CRUD, filtering, search, sort tests
└── tsconfig.json               # TypeScript config for test files
```

Root changes:
- `Makefile`: add `test-e2e` and `test-e2e-down` targets
- `.gitignore`: add Playwright artifacts (`e2e/test-results/`, `e2e/playwright-report/`)

## Docker Setup

### Dockerfile.server (multi-stage)

```dockerfile
FROM golang:1.24 AS builder
RUN git clone --depth 1 https://github.com/PromoForge/promoforge.git /src
WORKDIR /src
RUN make promoforge-server promoforge-sql-tool

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*
COPY --from=builder /src/promoforge-server /usr/local/bin/
COPY --from=builder /src/promoforge-sql-tool /usr/local/bin/
COPY --from=builder /src/config /etc/promoforge/config
COPY --from=builder /src/schema /etc/promoforge/schema
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

### entrypoint.sh

Waits for postgres to be ready, installs the schema, then starts the server:

```bash
#!/bin/bash
set -e

# Wait for postgres
until pg_isready -h postgres -p 5432 -U promoforge; do
  sleep 1
done

# Install schema
cd /etc/promoforge
promoforge-sql-tool -u promoforge --pw promoforge -h postgres -p 5432 --pl postgres18 --db promoforge create || true
promoforge-sql-tool -u promoforge --pw promoforge -h postgres -p 5432 --pl postgres18 --db promoforge setup -v 0.0
promoforge-sql-tool -u promoforge --pw promoforge -h postgres -p 5432 --pl postgres18 --db promoforge update-schema -d /etc/promoforge/schema/postgresql/v18/promoforge/versioned

# Start server
exec promoforge-server --config-file /etc/promoforge/config/development-postgres18.yaml --allow-no-auth start
```

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: promoforge
      POSTGRES_PASSWORD: promoforge
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U promoforge"]
      interval: 2s
      timeout: 5s
      retries: 10

  promoforge:
    build:
      context: .
      dockerfile: Dockerfile.server
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "7243:7243"
    environment:
      - DB_HOST=postgres
```

Note: The server config references `127.0.0.1:5432` for postgres. Inside docker-compose, the server needs to reach postgres at `postgres:5432`. The entrypoint or a test-specific config override will handle this (override `connectAddr` to `postgres:5432`).

## Playwright Config

```typescript
// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // sequential — tests share seeded data
  retries: 0,
  reporter: 'html',
  globalSetup: './global-setup.ts',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'cd .. && PUBLIC_API_URL=http://localhost:7243 bun run dev --port 5174',
    port: 5174,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

## Test Data Seeding

`global-setup.ts` calls the real API to create:

1. One test application (name: `e2e-test-app-{timestamp}`)
2. 3-5 test attributes across different entities/types

Stores the created IDs in a JSON file (`e2e/.test-state.json`) so tests and teardown can reference them.

## Makefile Targets

```makefile
test-e2e:
	cd e2e && docker compose up --build -d
	cd e2e && bunx playwright test
	cd e2e && docker compose down -v

test-e2e-down:
	cd e2e && docker compose down -v
```

## Key Decisions

- **No mocks**: Tests hit real API through the real UI
- **Chromium only**: No need for cross-browser testing at this stage
- **Sequential tests**: Shared seeded data, simpler than parallel with isolated data
- **Non-default ports**: Avoid collisions with running dev environment
- **Shallow clone** (`--depth 1`): Faster image builds
- **Docker layer caching**: Rebuilds only when promoforge main changes
