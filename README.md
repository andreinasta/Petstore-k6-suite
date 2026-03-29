# k6 Performance Testing Framework

A comprehensive performance testing framework built with [k6](https://k6.io/) targeting the [Petstore API](https://api.petstoreapi.com) and [Sauce Demo](https://www.saucedemo.com/) frontend.

Covers API load testing, browser-based performance testing, and hybrid scenarios with real-time monitoring via Grafana.

## Tech Stack

- **k6 v1.7.0** — load testing engine
- **k6 Browser Module** — Chromium-based frontend performance testing
- **Grafana + InfluxDB** — real-time dashboards (Docker)
- **GitHub Actions** — CI/CD pipeline
- **k6 Cloud** — cloud execution support

## Project Structure

```
k6test/
├── config/
│   ├── environments.js        # local / staging / prod base URLs
│   └── thresholds.js          # per-domain thresholds with per-endpoint granularity
├── data/
│   └── testdata.json          # test payloads
├── helpers/
│   ├── auth.js                # user registration + token helpers
│   ├── checks.js              # reusable check functions
│   └── report.js              # HTML + JSON report generation
├── utils/
│   └── request.js             # HTTP wrapper with base URL, headers, 10s timeout
├── tests/
│   ├── pets.test.js           # CRUD pets flow with custom metrics
│   ├── users.test.js          # CRUD users flow (self-contained auth)
│   └── store.test.js          # CRUD orders flow
├── scenarios/
│   ├── pets/                  # smoke, load, stress, spike, soak, constant-rate, ramping-rate
│   ├── users/                 # smoke, load, stress
│   ├── store/                 # smoke, load, stress
│   └── browser/               # smoke, load, hybrid (Sauce Demo)
├── grafana/
│   └── dashboard.json         # custom k6 Grafana dashboard
├── docker-compose.yml         # InfluxDB + Grafana stack
└── .github/workflows/
    └── k6-tests.yml           # CI/CD pipeline
```

## Quick Start

### Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) v0.46+
- [Docker](https://docs.docker.com/get-docker/) (optional, for Grafana dashboards)

### Run Tests

```bash
# Smoke tests (quick sanity check, ~30s)
npm run test:pets:smoke
npm run test:users:smoke
npm run test:browser:smoke

# Load tests (dev profile, ~50s)
npm run test:pets:load
npm run test:users:load

# Load tests (prod profile, ~9min)
npm run test:pets:load:prod
npm run test:users:load:prod

# Stress tests (dev profile, ~4min)
npm run test:pets:stress
npm run test:users:stress

# Browser tests
npm run test:browser:smoke
```

### Environment Configuration

```bash
# Target a specific environment (default: prod)
k6 run -e ENV=staging scenarios/pets/smoke.js
k6 run -e ENV=local scenarios/pets/smoke.js

# Use production durations
k6 run -e PROFILE=prod scenarios/pets/load.js
```

## Test Types

| Type | Purpose | VUs | Duration |
|------|---------|-----|----------|
| **Smoke** | Sanity check | 1 | 30s |
| **Load** | Expected traffic | 10 | 50s / 9m (prod) |
| **Stress** | Find breaking point | 10 → 80 | 4m / 30m (prod) |
| **Spike** | Sudden burst | 5 → 100 | 3m |
| **Soak** | Sustained load | 10 | 1.5m / 34m (prod) |
| **Constant Rate** | Fixed throughput | auto | 30s at 5 iter/s |
| **Ramping Rate** | Variable throughput | auto | 50s, 1 → 10 iter/s |
| **Browser Smoke** | Frontend performance | 1 | 1 iteration |
| **Browser Load** | Frontend under load | 3 | 1m |
| **Hybrid** | API + browser combined | 10 + 2 | 1m |

## Test Domains

### Pets API
Full CRUD cycle: List → Create → Get → Update → Delete. Requires auth token. Thresholds tuned from real baselines (e.g., `list-pets p(95) < 1200ms`).

### Users API
Self-contained CRUD cycle: each iteration registers its own user, authenticates, performs CRUD, then deletes. No shared setup needed.

### Store API
Order CRUD cycle with dependencies (requires user + pet). Note: store endpoints currently return 404 (API not implemented). Tests kept to demonstrate the pattern.

### Browser (Sauce Demo)
Chromium-based tests against [saucedemo.com](https://www.saucedemo.com/): Login → Add to Cart → Checkout → Verify confirmation. Collects Web Vitals automatically (LCP, FCP, CLS, TTFB).

## Thresholds

Thresholds are defined per domain in `config/thresholds.js` with per-endpoint granularity using tags:

```javascript
// Global
http_req_duration: p(95) < 900ms, p(99) < 1200ms
http_req_failed:   rate < 1%
checks:            rate > 95%

// Per-endpoint examples (pets)
list-pets:   p(95) < 1200ms
create-pet:  p(95) < 1000ms
get-pet:     p(95) < 350ms
update-pet:  p(95) < 250ms
delete-pet:  p(95) < 250ms

// Browser Web Vitals
LCP:  p(75) < 2500ms
FCP:  p(75) < 1800ms
CLS:  p(75) < 0.1
TTFB: p(75) < 800ms
```

## Custom Metrics

Each domain tracks business-level metrics beyond built-in HTTP metrics:

| Metric | Type | Purpose |
|--------|------|---------|
| `*_crud_cycle_duration` | Trend | Full CRUD cycle time (percentiles) |
| `*_created` | Counter | Total successful creates |
| `*_crud_success_rate` | Rate | Percentage of error-free iterations |

## Reporting

Every scenario generates timestamped reports in `results/`:
- **HTML** — visual report via k6-reporter
- **JSON** — machine-readable results
- **Console** — summary via textSummary

## Real-Time Monitoring

```bash
# Start Grafana + InfluxDB
docker-compose up -d

# Run any test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 scenarios/pets/load.js
```

Grafana available at `http://localhost:3000` (admin/admin). Import `grafana/dashboard.json` for the custom k6 dashboard.

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/k6-tests.yml`):

| Trigger | Tests | Purpose |
|---------|-------|---------|
| Push / PR to main | Pets + Users smoke | Quality gate — blocks merge if thresholds fail |
| Scheduled (Monday 6am) | Load tests (prod profile) | Catch performance regressions |
| Scheduled (Monday 6am) | Stress tests (prod profile) | Validate peak traffic handling |

Reports are uploaded as artifacts on every run.

## Performance Baselines

Measured against `https://api.petstoreapi.com`:

**Pets (10 VUs load):**
| Endpoint | p(95) |
|----------|-------|
| list-pets | 936ms |
| create-pet | 798ms |
| get-pet | 284ms |
| update-pet | 172ms |
| delete-pet | 185ms |

**Users (80 VUs stress):** All endpoints under 136ms p(95). 1 failure out of 5,475 iterations.

**Key finding:** API throttles under heavy load (list-pets degrades to 6s p(95) at 80 VUs) but returns 0% HTTP errors — graceful degradation, no crashes.

## k6 Cloud

Configured for [Grafana Cloud k6](https://grafana.com/products/cloud/k6/). Run any scenario in the cloud:

```bash
k6 cloud scenarios/pets/smoke.js
```
