import { check } from 'k6';

export function checkStatus(response, expectedStatus = 200) {
  check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
}

export function checkResponseTime(response, maxMs = 500) {
  check(response, {
    [`response time < ${maxMs}ms`]: (r) => r.timings.duration < maxMs,
  });
}

export function checkBody(response, field) {
  check(response, {
    [`body contains ${field}`]: (r) => r.json().hasOwnProperty(field),
  });
}
