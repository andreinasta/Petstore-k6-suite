export const defaultThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% of requests under 500ms
  http_req_failed: ['rate<0.01'],                    // less than 1% errors
  http_reqs: ['rate>0'],                              // at least some requests made
};
