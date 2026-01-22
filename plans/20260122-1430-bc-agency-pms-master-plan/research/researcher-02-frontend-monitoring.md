# Frontend & Monitoring Architecture Research
**Date:** 2026-01-22 | **Focus:** Next.js 14 App Router + Production Observability Stack

---

## 1. Next.js 14 App Router Architecture

### Server-First by Default
- All components default to server components (no JS shipped to browser)
- Client interactivity via `"use client"` directive at module top
- Solves: Performance, data fetching, secret management, bundle bloat

### Component Strategy
**Server Components (Default):**
- Data fetching, composition, secrets, markdown/MDX processing
- No bundle size impact
- Database/SDK access safe

**Client Components (Leaf-Level Only):**
- Interactive elements, browser APIs, local state with hooks
- Minimize scope—wrapping large trees disables RSC benefits

### Data Flow Pattern
**Critical:** Pass data via props server→client, never reverse. Server fetches, client renders interactivity.

### Streaming & Progressive Hydration
```
Suspense boundaries + loading.js + nested layouts
= Render critical UI first, progressive hydration with islands
```

---

## 2. Shadcn/ui + Tailwind CSS Integration

### Copy-Paste Architecture
- Own your components (not imported dependency)
- Full code control, no lock-in
- Radix primitives + Tailwind utilities

### Next.js 14 Setup Pattern
```
1. npx shadcn-ui@latest init
2. Configure components dir: ./components/ui
3. Add components: npx shadcn-ui@latest add [button|card|etc]
4. Extend tailwind.config with brand tokens
```

### Theming Strategy
- Extend Tailwind config for custom colors/spacing
- Shadcn tokens for design system consistency
- App Router compatible (no page router workaround needed)

---

## 3. State Management: Zustand + React Query

### Separation of Concerns
**React Query (TanStack Query):** Server state (data fetching, caching, sync)
**Zustand:** Client state (UI preferences, theme, local filters)

### Dashboard Implementation Pattern
```
├─ TanStack Query: API data, background updates, cache invalidation
├─ Zustand: Feature-specific stores (DashboardFiltersStore)
└─ Components: Presentational only, logic in stores
```

### Benefits
- No Redux boilerplate
- Minimal bundle overhead
- Automatic cache management (React Query)
- Lightweight global state (Zustand)

---

## 4. Production Monitoring Stack (2026)

### Architecture: Prometheus + Grafana + Loki
```
Node.js App (prom client) → Prometheus (pull-based metrics)
                         ↓
                    Grafana (visualization)

Logs (Promtail) → Loki (log aggregation) → Grafana
```

### Core Components

**Prometheus:**
- Pull-based metrics collection (reliable during network partitions)
- Time-series database for efficient querying
- Multi-target scraping intervals

**Grafana:**
- Multi-source visualization dashboard
- Alerting engine with notification channels
- Plugin ecosystem for extended integrations

**Loki:**
- Log aggregation (push-based, cost-effective)
- Horizontally scalable, multi-tenant
- Label-based querying (similar to Prometheus)

### Node.js Integration
```bash
npm install prom-client  # Instrument metrics
# Expose /metrics endpoint for Prometheus scrape
# Configure Promtail for log shipping to Loki
```

### 2026 Best Practice
Integrated observability (metrics + logs + traces) improves MTTR by ~40%; 85% enterprises adopt this stack.

---

## 5. Docker Compose Production Pattern

### Multi-Service Architecture
```yaml
services:
  app:         # Next.js + Node backend
  postgres:    # Database
  prometheus:  # Metrics
  grafana:     # Dashboards
  loki:        # Logs
```

### Dockerfile Optimization
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Production Checklist
- [ ] Multi-stage builds (separate dev/prod images)
- [ ] Alpine base images (lightweight security)
- [ ] .dockerignore to exclude unnecessary files
- [ ] Health checks defined (HEALTHCHECK instruction)
- [ ] Resource limits per service (memory, CPU)
- [ ] Persistent volumes for databases
- [ ] Environment variables via .env.production
- [ ] Logging to stdout/stderr (Docker capture)

---

## 6. Practical Implementation Roadmap

### Phase 1: Frontend Foundation
1. Initialize Next.js 14 App Router project
2. Install shadcn/ui components (button, card, table for dashboard)
3. Setup Tailwind CSS v4 with custom brand palette
4. Create layout hierarchy with Server + Client component split

### Phase 2: State Management
1. Install React Query + Zustand
2. Setup React Query provider with cache config
3. Create Zustand stores for UI state (filters, theme, sidebar)
4. Implement custom hooks for query + store integration

### Phase 3: Monitoring Infrastructure
1. Setup Docker Compose with Prometheus, Grafana, Loki
2. Add prom-client to Node.js backend
3. Configure Promtail for log shipping
4. Build Grafana dashboards (request latency, error rate, logs)

### Phase 4: Production Deployment
1. Containerize app with multi-stage Dockerfile
2. Add health checks and resource limits
3. Configure environment-specific compose files
4. Deploy with docker-compose up -d

---

## Key Metrics to Monitor (PMS Dashboard)
- Request latency (p50, p95, p99)
- Error rate (5xx responses, failed tasks)
- Active users (concurrent connections)
- Task completion rate
- Database query performance
- Log errors/warnings (correlated with dashboards)

---

## Sources
- [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Client Components Documentation](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [Shadcn/ui Installation Guide](https://ui.shadcn.com/docs/installation/next)
- [Shadcn with Next.js 14](https://www.freecodecamp.org/news/shadcn-with-next-js-14/)
- [Zustand + React Query State Management](https://medium.com/@freeyeon96/zustand-react-query-new-state-management-7aad6090af56)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state)
- [Cloud-Native Observability Stack 2026](https://johal.in/cloud-native-observability-stack-prometheus-grafana-loki-and-tempo-integration-for-full-stack-monitoring-2026-3/)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/get-started/overview/)
- [Docker Node.js Containerization](https://docs.docker.com/guides/nodejs/containerize/)
- [Docker Compose Node.js Development](https://www.cloudbees.com/blog/using-docker-compose-for-nodejs-development/)
- [Production Docker Node.js Setup](https://medium.com/@zhamdi/setup-production-docker-and-docker-compose-with-node-js-52b7bf043b45)
