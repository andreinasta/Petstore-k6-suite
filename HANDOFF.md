# Handoff: k6 Performance Testing Framework for Petstore API

## Goal
Learn k6 from scratch to prepare for a technical interview in 4-5 days. Building a full performance testing framework against the Petstore API (`https://api.petstoreapi.com`, docs at `https://docs.petstoreapi.com/`).

## Current Progress

### Project Structure (complete)
```
k6test/
├── package.json              # npm scripts for each scenario type
├── config/
│   ├── environments.js       # baseUrl: https://api.petstoreapi.com
│   └── thresholds.js         # p95<500ms, p99<1000ms, error rate<1%
├── data/
│   └── testdata.json         # sample pet data (Rontzy, Bobo, Pisa)
├── helpers/
│   ├── auth.js               # registerUser() → registers + gets Bearer token
│   └── checks.js             # checkStatus(), checkResponseTime(), checkBody()
├── scenarios/
│   ├── smoke.js              # 1 VU, 30s — WORKING, ALL CHECKS PASS
│   ├── load.js               # ramp to 10 VUs, 5min — needs crudPets wiring
│   ├── stress.js             # ramp to 80 VUs — needs crudPets wiring
│   ├── spike.js              # burst to 100 VUs — needs crudPets wiring
│   └── soak.js               # 10 VUs, 30min — needs crudPets wiring
├── tests/
│   └── pets.test.js          # crudPets() — full CRUD with group() per operation
└── utils/
    └── request.js            # get/post/put/del wrappers with base URL + headers
```

### What's Working
- **Smoke test passes 100%** — all checks green, all thresholds met
- **Auth flow** — `helpers/auth.js` registers a unique user per test run (`k6user_{timestamp}`), then calls `POST /v1/auth/tokens` to get a Bearer token
- **CRUD flow** — `tests/pets.test.js` exports `crudPets(token)` which does:
  - `GET /v1/pets` (public, no auth)
  - `POST /v1/pets` with full pet payload + Bearer token → 201
  - `GET /v1/pets/{id}` → 200
  - `PUT /v1/pets/{id}` with Bearer token → 200
  - `DELETE /v1/pets/{id}` with Bearer token → 204
- Each operation wrapped in `group()` for per-step visibility
- Token obtained once in `setup()`, passed to default function via `data` parameter

### API Details
- Base URL: `https://api.petstoreapi.com`
- Endpoints use `/v1/` prefix
- `GET /v1/pets` — public, no auth needed
- `POST/PUT/DELETE` on pets require `Authorization: Bearer {token}`
- Register: `POST /v1/users` (username, email, password, firstName, lastName)
- Get token: `POST /v1/auth/tokens` (username, password) → returns `{ token, expiresIn, user }`
- Create pet requires full payload: name, species, breed, ageMonths, size, color, gender, goodWithKids, price, currency, status, description, medicalInfo

## What Didn't Work
- **Placeholder API paths** — originally used `/api/v1/pets` which doesn't exist; correct path is `/v1/pets`
- **Original baseUrl** — `https://petstoreapi.com` is the website, API is at `https://api.petstoreapi.com`
- **`winget install Grafana.k6`** — didn't work; needed `winget install k6` (search first, use short name)
- **Variable scoping with group()** — declaring `const petId` inside a group() makes it inaccessible in other groups. Must use `let petId` at function level
- **Minimal create pet payload** — API requires many fields (species, breed, ageMonths, etc.), not just name/status
- **Token from register endpoint** — `POST /v1/users` does NOT return a token; must call `/v1/auth/tokens` separately
- **`registerUser.username`** — can't access local variables as function properties; must store in variables first
- **`http_reqs: rate>10` threshold** — unrealistic for smoke test with 1 VU and sleep(1); changed to `rate>0`

## What the User Prefers
- **Learn by doing** — user writes the code, assistant provides guidance/snippets/reviews
- **Best practices from the start** — always use production-grade patterns (group(), proper structure), never simplified versions that need upgrading later
- **Direct fixes when asked** — user will explicitly say "fix it" when they want code written for them

## Next Steps
1. **Wire remaining scenarios** — load.js, stress.js, spike.js, soak.js all need to import `crudPets` from tests/pets.test.js and use `setup()`/`data.token` pattern like smoke.js
2. **Add more test files** — `tests/store.test.js`, `tests/user.test.js` for other Petstore API endpoints
3. **Use testdata.json** — parameterize pet creation with data from `data/testdata.json` instead of hardcoded values
4. **Interview prep topics still to cover:**
   - Scenarios & executors (constant-vus, ramping-vus, arrival-rate)
   - Custom metrics (Counter, Gauge, Rate, Trend)
   - Tags for filtering results
   - CI/CD integration
   - Output/reporting (JSON, CSV, Grafana + InfluxDB)
   - k6 Cloud
   - Browser module (`k6/browser`)
5. **Remove console.log("Token:", token)** from pets.test.js — left from debugging
