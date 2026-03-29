export const defaultThresholds = {
  http_req_duration: ["p(95)<800", "p(99)<1000"],
  http_req_failed: ["rate<0.01"],
  http_reqs: ["rate>0"],
  "http_req_duration{name:list-pets}": ["p(95)<500"],
  "http_req_duration{name:get-pet}": ["p(95)<300"],
  "http_req_duration{name:create-pet}": ["p(95)<800"],
  "http_req_duration{name:update-pet}": ["p(95)<800"],
  "http_req_duration{name:delete-pet}": ["p(95)<500"],
};
