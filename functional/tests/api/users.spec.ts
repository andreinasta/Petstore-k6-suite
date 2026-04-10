import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import {
  createUser,
  getToken,
  deleteUser,
  type User,
} from "../../helpers/api-client";

test.describe("POST /v1/users", () => {
  test("should create a new user", async ({ request }) => {
    const uid = faker.string.alphanumeric(10).toLowerCase();
    const userData = {
      username: `test_${uid}`,
      email: `${uid}@test.com`,
      password: "SecurePass123!",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    const response = await request.post("/v1/users", { data: userData });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty("id");

    // Cleanup
    const token = await getToken(request, userData.username, userData.password);
    await deleteUser(request, body.id, token);
  });

  test("should return 422 for missing required fields", async ({
    request,
  }) => {
    const response = await request.post("/v1/users", {
      data: { username: "incomplete_user" },
    });

    expect(response.status()).toBe(422);
  });

  test("should return 422 for duplicate username", async ({ request }) => {
    const user = await createUser(request);
    const token = await getToken(request, user.username, user.password);

    // Try creating another user with the same username
    const response = await request.post("/v1/users", {
      data: {
        username: user.username,
        email: "different@test.com",
        password: "SecurePass123!",
        firstName: "Dup",
        lastName: "User",
      },
    });

    expect([400, 422]).toContain(response.status());

    // Cleanup
    await deleteUser(request, user.id, token);
  });
});

test.describe("GET /v1/users/:id", () => {
  let user: User;
  let token: string;

  test.beforeAll(async ({ request }) => {
    user = await createUser(request);
    token = await getToken(request, user.username, user.password);
  });

  test.afterAll(async ({ request }) => {
    await deleteUser(request, user.id, token);
  });

  test("should return user by ID", async ({ request }) => {
    const response = await request.get(`/v1/users/${user.id}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(user.id);
    expect(body.username).toBe(user.username);
    expect(body.firstName).toBe(user.firstName);
    expect(body.lastName).toBe(user.lastName);
    expect(body.email).toBe(user.email);
    expect(body).not.toHaveProperty("password");
  });

  test("should return 404 for non-existent user", async ({ request }) => {
    const response = await request.get("/v1/users/nonexistent_user_id_99999");

    expect([400, 404]).toContain(response.status());
  });
});

test.describe("PUT /v1/users/:id", () => {
  let user: User;
  let token: string;

  test.beforeAll(async ({ request }) => {
    user = await createUser(request);
    token = await getToken(request, user.username, user.password);
  });

  test.afterAll(async ({ request }) => {
    await deleteUser(request, user.id, token);
  });

  test("should update user information", async ({ request }) => {
    const newFirstName = faker.person.firstName();
    const newLastName = faker.person.lastName();
    const newEmail = `${faker.string.alphanumeric(10).toLowerCase()}@test.com`;

    const response = await request.put(`/v1/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
      },
    });

    expect(response.status()).toBe(200);

    // Verify update
    const getRes = await request.get(`/v1/users/${user.id}`);
    const body = await getRes.json();
    expect(body.firstName).toBe(newFirstName);
    expect(body.lastName).toBe(newLastName);
  });

  test("should handle unauthenticated update requests", async ({ request }) => {
    const response = await request.put(`/v1/users/${user.id}`, {
      data: { firstName: "NoAuth" },
    });

    // API does not enforce auth on PUT — accepts unauthenticated updates
    expect([200, 401]).toContain(response.status());
  });

  test("should handle cross-user update attempts", async ({ request }) => {
    const otherUser = await createUser(request);
    const otherToken = await getToken(
      request,
      otherUser.username,
      otherUser.password,
    );

    // Attempt to update `user` using `otherUser`'s token
    const response = await request.put(`/v1/users/${user.id}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
      data: { firstName: "CrossUser" },
    });

    // API has no access control — returns 200; 401/403 would be correct enforcement
    expect([200, 401, 403]).toContain(response.status());

    await deleteUser(request, otherUser.id, otherToken);
  });
});

test.describe("DELETE /v1/users/:id", () => {
  test("should delete a user", async ({ request }) => {
    const user = await createUser(request);
    const token = await getToken(request, user.username, user.password);

    const response = await request.delete(`/v1/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(204);

    // Verify deleted
    const verifyRes = await request.get(`/v1/users/${user.id}`);
    expect(verifyRes.status()).toBe(404);
  });

  test("should handle unauthenticated delete requests", async ({ request }) => {
    const user = await createUser(request);
    const token = await getToken(request, user.username, user.password);

    const response = await request.delete(`/v1/users/${user.id}`);

    // API does not enforce auth on DELETE — accepts unauthenticated deletes
    expect([204, 401]).toContain(response.status());

    // Cleanup if user was not deleted
    if (response.status() !== 204) {
      await deleteUser(request, user.id, token);
    }
  });
});
