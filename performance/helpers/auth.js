import http from "k6/http";
import { currentEnv } from "../config/environments.js";

export function registerUser() {
  const username = `k6user_${Date.now()}`;
  const password = `k6password_${Date.now()}`;

  //Register
  const registerRes = http.post(
    `${currentEnv.baseUrl}/v1/users`,
    JSON.stringify({
      username,
      email: `${username}@test.com`,
      password,
      firstName: "K6",
      lastName: "Tester",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const userId = registerRes.json().id;

  const tokenRes = http.post(
    `${currentEnv.baseUrl}/v1/auth/tokens`,
    JSON.stringify({
      username,
      password,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return { token: tokenRes.json().token, userId };
}

// Returns token + userId for scenarios that need both (e.g., store tests)
export function registerUserFull() {
  const username = `k6user_${Date.now()}`;
  const password = `k6password_${Date.now()}`;

  const registerRes = http.post(
    `${currentEnv.baseUrl}/v1/users`,
    JSON.stringify({
      username,
      email: `${username}@test.com`,
      password,
      firstName: "K6",
      lastName: "Tester",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const userId = registerRes.json().id;

  const tokenRes = http.post(
    `${currentEnv.baseUrl}/v1/auth/tokens`,
    JSON.stringify({
      username,
      password,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return { token: tokenRes.json().token, userId };
}
