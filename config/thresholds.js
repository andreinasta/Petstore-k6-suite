// Shared thresholds for all tests
const baseThresholds = {
  http_req_duration: ["p(95)<900", "p(99)<1200"],
  http_req_failed: ["rate<0.01"],
  http_reqs: ["rate>0"],
};

// Pet-specific thresholds
export const petThresholds = {
  ...baseThresholds,
  "http_req_duration{name:list-pets}": ["p(95)<1200"],
  "http_req_duration{name:get-pet}": ["p(95)<350"],
  "http_req_duration{name:create-pet}": ["p(95)<1000"],
  "http_req_duration{name:update-pet}": ["p(95)<250"],
  "http_req_duration{name:delete-pet}": ["p(95)<250"],
};

// User-specific thresholds (baselines TBD after smoke runs)
export const userThresholds = {
  ...baseThresholds,
  "http_req_duration{name:create-user}": ["p(95)<300"],
  "http_req_duration{name:get-token}": ["p(95)<300"],
  "http_req_duration{name:get-user}": ["p(95)<300"],
  "http_req_duration{name:update-user}": ["p(95)<300"],
  "http_req_duration{name:delete-user}": ["p(95)<300"],
};
