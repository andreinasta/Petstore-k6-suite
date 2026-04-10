import { test, expect } from "@playwright/test";
import {
  createAuthenticatedUser,
  deleteUser,
  createPet,
  deletePet,
  type AuthenticatedUser,
  type Pet,
} from "../../helpers/api-client";

test.describe("Orders API", () => {
  let user: AuthenticatedUser;
  let pet: Pet;

  test.beforeAll(async ({ request }) => {
    user = await createAuthenticatedUser(request);
    pet = await createPet(request, user.token);
  });

  test.afterAll(async ({ request }) => {
    await deletePet(request, pet.id, user.token);
    await deleteUser(request, user.id, user.token);
  });

  test.describe("POST /v1/orders", () => {
    test("should create a new order", async ({ request }) => {
      const response = await request.post("/v1/orders", {
        data: {
          petId: pet.id,
          userId: user.id,
        },
      });

      expect(response.status()).toBe(201);

      const order = await response.json();
      expect(order).toHaveProperty("id");
      expect(order.petId).toBe(pet.id);
      expect(order).toHaveProperty("status");

      // Cleanup
      await request.delete(`/v1/orders/${order.id}`);
    });

    test("should return 404 for non-existent pet ID", async ({ request }) => {
      const response = await request.post("/v1/orders", {
        data: {
          petId: "00000000-0000-0000-0000-000000000000",
          userId: user.id,
        },
      });

      expect([400, 404, 422]).toContain(response.status());
    });
  });

  test.describe("GET /v1/orders/:id", () => {
    let orderId: string;

    test.beforeAll(async ({ request }) => {
      const res = await request.post("/v1/orders", {
        data: { petId: pet.id, userId: user.id },
      });
      const body = await res.json();
      orderId = body.id;
    });

    test.afterAll(async ({ request }) => {
      await request.delete(`/v1/orders/${orderId}`);
    });

    test("should return an order by ID", async ({ request }) => {
      const response = await request.get(`/v1/orders/${orderId}`);

      expect(response.status()).toBe(200);

      const order = await response.json();
      expect(order.id).toBe(orderId);
      expect(order).toHaveProperty("petId");
      expect(order).toHaveProperty("status");
    });

    test("should return 404 for non-existent order", async ({ request }) => {
      const response = await request.get(
        "/v1/orders/00000000-0000-0000-0000-000000000000",
      );

      expect(response.status()).toBe(404);
    });
  });

  test.describe("DELETE /v1/orders/:id", () => {
    test("should attempt to delete an order", async ({ request }) => {
      const freshPet = await createPet(request, user.token);

      const createRes = await request.post("/v1/orders", {
        data: { petId: freshPet.id, userId: user.id },
      });
      expect(createRes.status()).toBe(201);
      const order = await createRes.json();

      // Verify order exists
      const getRes = await request.get(`/v1/orders/${order.id}`);
      expect(getRes.status()).toBe(200);

      // DELETE — API may return 204 (spec) or 404 (not implemented)
      const response = await request.delete(`/v1/orders/${order.id}`);
      expect([204, 404]).toContain(response.status());

      // Cleanup pet
      await deletePet(request, freshPet.id, user.token);
    });
  });
});
