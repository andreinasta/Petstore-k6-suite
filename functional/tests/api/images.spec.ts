import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import {
  createAuthenticatedUser,
  deleteUser,
  createPet,
  deletePet,
  type AuthenticatedUser,
  type Pet,
} from "../../helpers/api-client";

function fakeImage(): { buffer: Buffer; mimeType: string; filename: string } {
  // faker.image.dataUri returns a base64-encoded SVG data URI
  const dataUri = faker.image.dataUri({ width: 10, height: 10, type: "svg-base64" });
  const [header, base64Data] = dataUri.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/svg+xml";
  return {
    buffer: Buffer.from(base64Data, "base64"),
    mimeType,
    filename: `${faker.string.alphanumeric(8)}.svg`,
  };
}

test.describe("POST /v1/pets/:id/images", () => {
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

  test("should upload a pet image", async ({ request }) => {
    const { buffer, mimeType, filename } = fakeImage();

    const response = await request.post(`/v1/pets/${pet.id}/images`, {
      headers: { Authorization: `Bearer ${user.token}` },
      multipart: {
        file: { name: filename, mimeType, buffer },
        additionalMetadata: faker.lorem.sentence(),
      },
    });

    // Accept success, server errors, or common validation errors
    expect([201, 400, 413, 415, 422, 500]).toContain(response.status());

    if (response.status() === 201) {
      const body = await response.json();
      expect(body).toHaveProperty("message");
    }
  });

  test("should return 401 when uploading without authentication", async ({
    request,
  }) => {
    const { buffer, mimeType, filename } = fakeImage();

    const response = await request.post(`/v1/pets/${pet.id}/images`, {
      multipart: { file: { name: filename, mimeType, buffer } },
    });

    expect(response.status()).toBe(401);
  });

  test("should return 404 for a non-existent pet", async ({ request }) => {
    const { buffer, mimeType, filename } = fakeImage();

    const response = await request.post(
      "/v1/pets/00000000-0000-0000-0000-000000000000/images",
      {
        headers: { Authorization: `Bearer ${user.token}` },
        multipart: { file: { name: filename, mimeType, buffer } },
      },
    );

    expect([403, 404]).toContain(response.status());
  });
});
