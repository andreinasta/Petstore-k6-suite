import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import {
  createAuthenticatedUser,
  deleteUser,
  type AuthenticatedUser,
} from "../../helpers/api-client";

test.describe("POST /v1/chat/completions", () => {
  let user: AuthenticatedUser;

  test.beforeAll(async ({ request }) => {
    user = await createAuthenticatedUser(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteUser(request, user.id, user.token);
  });

  test("should return a completion for a non-streaming request", async ({
    request,
  }) => {
    const response = await request.post("/v1/chat/completions", {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        messages: [{ role: "USER", content: faker.lorem.sentence() }],
        model: "PET_ADVISOR_1",
        stream: false,
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("id");
    expect(body.object).toBe("chat.completion");
    expect(Array.isArray(body.choices)).toBe(true);
    expect(body.choices.length).toBeGreaterThan(0);
    expect(body.choices[0].message).toHaveProperty("content");
    expect(body.choices[0].message.role).toBe("assistant");
    expect(body).toHaveProperty("usage");
    expect(body.usage).toHaveProperty("totalTokens");
  });

  test("should return SSE stream for a streaming request", async ({
    request,
  }) => {
    const response = await request.post("/v1/chat/completions", {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        messages: [{ role: "USER", content: faker.lorem.sentence() }],
        stream: true,
      },
    });

    expect([200, 201]).toContain(response.status());
    expect(response.headers()["content-type"]).toContain("text/event-stream");
  });

  test("should return 401 without authentication", async ({ request }) => {
    const response = await request.post("/v1/chat/completions", {
      data: {
        messages: [{ role: "USER", content: faker.lorem.sentence() }],
        stream: false,
      },
    });

    expect(response.status()).toBe(401);
  });

  test("should return 422 for missing messages field", async ({ request }) => {
    const response = await request.post("/v1/chat/completions", {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { stream: false },
    });

    expect([400, 422]).toContain(response.status());
  });

  test("should support PET_ADVISOR_TURBO model", async ({ request }) => {
    const response = await request.post("/v1/chat/completions", {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        messages: [{ role: "USER", content: faker.lorem.sentence() }],
        model: "PET_ADVISOR_TURBO",
        stream: false,
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("id");
    expect(body.object).toBe("chat.completion");
  });
});
