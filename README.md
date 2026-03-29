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

## Test Results

Measured against `https://api.petstoreapi.com` (dev profile durations).

### Pets API

#### Summary

| Scenario | VUs | Duration | Iterations | Requests | Error Rate | Checks | Thresholds |
|----------|-----|----------|------------|----------|------------|--------|------------|
| **Smoke** | 1 | 30s | 18 | 93 | 0.00% | 100% | All passed |
| **Load** | 10 | 50s | 185 | 928 | 0.00% | 100% | All passed |
| **Stress** | 10→80 | 3m 51s | 1,405 | 7,028 | 0.00% | 100% | 5/7 crossed |

#### Response Times by Endpoint (p95)

| Endpoint | Smoke (1 VU) | Load (10 VUs) | Stress (80 VUs) | Threshold |
|----------|-------------|---------------|-----------------|-----------|
| list-pets | 234ms | 879ms | 6,033ms | p(95) < 1200ms |
| create-pet | 143ms | 825ms | 6,275ms | p(95) < 1000ms |
| get-pet | 125ms | 324ms | 616ms | p(95) < 350ms |
| update-pet | 125ms | 225ms | 921ms | p(95) < 250ms |
| delete-pet | 122ms | 158ms | 707ms | p(95) < 250ms |

#### Custom Metrics

| Metric | Smoke | Load | Stress |
|--------|-------|------|--------|
| CRUD cycle p(95) | 751ms | 1,668ms | 9,992ms |
| Pets created | 18 | 185 | 1,405 |
| CRUD success rate | 100% | 100% | 100% |
| Throughput (req/s) | 3.0 | 17.8 | 30.3 |

### Users API

#### Summary

| Scenario | VUs | Duration | Iterations | Requests | Error Rate | Checks | Thresholds |
|----------|-----|----------|------------|----------|------------|--------|------------|
| **Smoke** | 1 | 30s | 19 | 95 | 0.00% | 100% | All passed |
| **Load** | 10 | 50s | 255 | 1,275 | 0.00% | 100% | All passed |
| **Stress** | 10→80 | 3m 51s | 5,480 | 27,398 | 0.004% | 99.99% | All passed |

#### Response Times by Endpoint (p95)

| Endpoint | Smoke (1 VU) | Load (10 VUs) | Stress (80 VUs) | Threshold |
|----------|-------------|---------------|-----------------|-----------|
| create-user | 140ms | 128ms | 139ms | p(95) < 300ms |
| get-token | 118ms | 125ms | 129ms | p(95) < 300ms |
| get-user | 117ms | 125ms | 129ms | p(95) < 300ms |
| update-user | 121ms | 128ms | 138ms | p(95) < 300ms |
| delete-user | 118ms | 126ms | 132ms | p(95) < 300ms |

#### Custom Metrics

| Metric | Smoke | Load | Stress |
|--------|-------|------|--------|
| CRUD cycle p(95) | 674ms | 633ms | 823ms |
| Users created | 19 | 255 | 5,480 |
| CRUD success rate | 100% | 100% | 100% |
| Throughput (req/s) | 3.1 | 24.8 | 118.6 |

### Key Findings

- **Zero HTTP errors on pets** across all scenarios — the API throttles under load but never breaks
- **Pets degrade significantly under stress** — list-pets goes from 234ms (1 VU) to 6,033ms (80 VUs), a 25x increase
- **Users are rock-solid** — all endpoints stay under 140ms p(95) even at 80 VUs, with only 2 check failures out of 32,878
- **Different scaling characteristics** — pets endpoints share a bottleneck (likely database queries on a growing collection), while user endpoints scale linearly
- **Throughput scales well for users** — 3.1 req/s at 1 VU → 118.6 req/s at 80 VUs (38x increase with 80x VUs)

## k6 Cloud

Configured for [Grafana Cloud k6](https://grafana.com/products/cloud/k6/). Run any scenario in the cloud:

```bash
k6 cloud scenarios/pets/smoke.js
```
