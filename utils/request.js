import http from 'k6/http';
import { currentEnv } from '../config/environments.js';

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export function get(path, params = {}) {
  const url = `${currentEnv.baseUrl}${path}`;
  return http.get(url, {
    headers: { ...defaultHeaders, ...params.headers },
    tags: params.tags || {},
    timeout: "10s",
  });
}

export function post(path, body, params = {}) {
  const url = `${currentEnv.baseUrl}${path}`;
  return http.post(url, JSON.stringify(body), {
    headers: { ...defaultHeaders, ...params.headers },
    tags: params.tags || {},
    timeout: "10s",
  });
}

export function put(path, body, params = {}) {
  const url = `${currentEnv.baseUrl}${path}`;
  return http.put(url, JSON.stringify(body), {
    headers: { ...defaultHeaders, ...params.headers },
    tags: params.tags || {},
    timeout: "10s",
  });
}

export function del(path, params = {}) {
  const url = `${currentEnv.baseUrl}${path}`;
  return http.del(url, null, {
    headers: { ...defaultHeaders, ...params.headers },
    tags: params.tags || {},
    timeout: "10s",
  });
}
