import { APIRequestContext } from "@playwright/test";
import { faker } from "@faker-js/faker";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthenticatedUser extends User {
  token: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  ageMonths: number;
  size: string;
  color: string;
  gender: string;
  goodWithKids: boolean;
  price: string;
  currency: string;
  status: string;
  description: string;
}

export async function createUser(request: APIRequestContext): Promise<User> {
  const uid = faker.string.alphanumeric(10).toLowerCase();
  const user = {
    username: `pw_${uid}`,
    email: `${uid}@test.com`,
    password: "SecurePass123!",
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  };

  const response = await request.post("/v1/users", { data: user });
  const body = await response.json();
  return { ...user, id: body.id };
}

export async function getToken(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const response = await request.post("/v1/auth/tokens", {
    data: { username, password },
  });
  const body = await response.json();
  return body.token;
}

export async function createAuthenticatedUser(
  request: APIRequestContext,
): Promise<AuthenticatedUser> {
  const user = await createUser(request);
  const token = await getToken(request, user.username, user.password);
  return { ...user, token };
}

export async function deleteUser(
  request: APIRequestContext,
  userId: string,
  token: string,
): Promise<void> {
  await request.delete(`/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createPet(
  request: APIRequestContext,
  token: string,
): Promise<Pet> {
  const response = await request.post("/v1/pets", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: faker.person.firstName(),
      species: "CAT",
      breed: faker.animal.cat(),
      ageMonths: faker.number.int({ min: 1, max: 120 }),
      size: "MEDIUM",
      color: faker.color.human(),
      gender: "MALE",
      goodWithKids: faker.datatype.boolean(),
      price: faker.commerce.price({ min: 50, max: 500, dec: 2 }),
      currency: "USD",
      status: "AVAILABLE",
      description: faker.lorem.sentence(),
      medicalInfo: {
        vaccinated: faker.datatype.boolean(),
        spayedNeutered: faker.datatype.boolean(),
        microchipped: faker.datatype.boolean(),
        specialNeeds: false,
        healthNotes: faker.lorem.sentence(),
      },
    },
  });
  return await response.json();
}

export async function deletePet(
  request: APIRequestContext,
  petId: string,
  token: string,
): Promise<void> {
  await request.delete(`/v1/pets/${petId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface Order {
  id: string;
  petId: string;
  userId?: string;
  status: string;
}

export async function createOrder(
  request: APIRequestContext,
  petId: string,
  userId: string,
): Promise<Order> {
  const response = await request.post("/v1/orders", {
    data: { petId, userId },
  });
  return await response.json();
}

export async function deleteOrder(
  request: APIRequestContext,
  orderId: string,
): Promise<void> {
  await request.delete(`/v1/orders/${orderId}`);
}
