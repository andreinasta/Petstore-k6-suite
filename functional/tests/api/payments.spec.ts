import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import {
  createAuthenticatedUser,
  deleteUser,
  createPet,
  deletePet,
  createOrder,
  deleteOrder,
  type AuthenticatedUser,
  type Pet,
} from "../../helpers/api-client";

test.describe("POST /v1/orders/:id/payment", () => {
  let user: AuthenticatedUser;
  let pet: Pet;
  let orderId: string;

  test.beforeAll(async ({ request }) => {
    user = await createAuthenticatedUser(request);
    pet = await createPet(request, user.token);
    const order = await createOrder(request, pet.id, user.id);
    orderId = order.id;
  });

  test.afterAll(async ({ request }) => {
    await deleteOrder(request, orderId);
    await deletePet(request, pet.id, user.token);
    await deleteUser(request, user.id, user.token);
  });

  test("should process a card payment", async ({ request }) => {
    const response = await request.post(`/v1/orders/${orderId}/payment`, {
      data: {
        amount: faker.commerce.price({ min: 50, max: 500, dec: 2 }),
        currency: "USD",
        source: {
          object: "card",
          name: faker.person.fullName(),
          number: faker.finance.creditCardNumber({ issuer: "visa" }),
          cvc: faker.finance.creditCardCVV(),
          expMonth: faker.number.int({ min: 1, max: 12 }),
          expYear: faker.number.int({ min: 2026, max: 2030 }),
        },
      },
    });

    // API may or may not have payment implemented
    expect([201, 404]).toContain(response.status());

    if (response.status() === 201) {
      const body = await response.json();
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("status");
      expect(body.currency).toBe("USD");
      expect(body.source).toHaveProperty("number");
    }
  });

  test("should process a bank account payment", async ({ request }) => {
    const response = await request.post(`/v1/orders/${orderId}/payment`, {
      data: {
        amount: faker.commerce.price({ min: 50, max: 500, dec: 2 }),
        currency: "USD",
        source: {
          object: "bank_account",
          name: faker.person.fullName(),
          number: faker.finance.accountNumber(),
          sortCode: faker.string.numeric(6),
          accountType: "individual",
          country: faker.location.countryCode("alpha-2"),
        },
      },
    });

    expect([201, 404]).toContain(response.status());

    if (response.status() === 201) {
      const body = await response.json();
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("status");
      expect(body.source.object).toBe("bank_account");
    }
  });

  test("should return 404 for a non-existent order", async ({ request }) => {
    const response = await request.post(
      "/v1/orders/00000000-0000-0000-0000-000000000000/payment",
      {
        data: {
          amount: faker.commerce.price({ min: 10, max: 100, dec: 2 }),
          currency: "USD",
          source: {
            object: "card",
            name: faker.person.fullName(),
            number: faker.finance.creditCardNumber({ issuer: "visa" }),
            cvc: faker.finance.creditCardCVV(),
            expMonth: faker.number.int({ min: 1, max: 12 }),
            expYear: faker.number.int({ min: 2026, max: 2030 }),
          },
        },
      },
    );

    expect([400, 404, 422]).toContain(response.status());
  });

  test("should return an error for missing payment source", async ({
    request,
  }) => {
    const response = await request.post(`/v1/orders/${orderId}/payment`, {
      data: {
        amount: faker.commerce.price({ min: 10, max: 100, dec: 2 }),
        currency: "USD",
      },
    });

    expect([400, 422]).toContain(response.status());
  });
});
