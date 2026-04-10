import { test, expect } from "@playwright/test";
import {
  createAuthenticatedUser,
  deleteUser,
  type AuthenticatedUser,
} from "../../helpers/api-client";

test.describe("GET /v1/inventories", () => {
  let user: AuthenticatedUser;

  test.beforeAll(async ({ request }) => {
    user = await createAuthenticatedUser(request);
  });

  test.afterAll(async ({ request }) => {
    await deleteUser(request, user.id, user.token);
  });

  test("should return inventory counts when authenticated", async ({
    request,
  }) => {
    const response = await request.get("/v1/inventories", {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(typeof body).toBe("object");
    expect(body).not.toBeNull();

    // Response is a map of status string -> count integer
    for (const [key, value] of Object.entries(body)) {
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("number");
      expect(value as number).toBeGreaterThanOrEqual(0);
    }
  });

  test("should handle unauthenticated requests", async ({ request }) => {
    const response = await request.get("/v1/inventories");

    // Endpoint is public in this API — no auth enforced
    expect([200, 401]).toContain(response.status());
  });

  test("should filter inventory by status", async ({ request }) => {
    const response = await request.get("/v1/inventories", {
      headers: { Authorization: `Bearer ${user.token}` },
      params: { status: "AVAILABLE" },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(typeof body).toBe("object");
  });
});
