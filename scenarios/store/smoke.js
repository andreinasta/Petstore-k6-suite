import http from "k6/http";
import { storeThresholds } from "../../config/thresholds.js";
import { crudOrders } from "../../tests/store.test.js";
import { registerUserFull } from "../../helpers/auth.js";
import { currentEnv } from "../../config/environments.js";
import { generateReport } from "../../helpers/report.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: storeThresholds,
};

// Create a user + pet so orders have valid petId and userId
export function setup() {
  const { token, userId } = registerUserFull();

  // Create a pet to use for orders
  const petRes = http.post(
    `${currentEnv.baseUrl}/v1/pets`,
    JSON.stringify({
      name: "OrderTestPet",
      species: "CAT",
      breed: "TestBreed",
      ageMonths: 12,
      size: "MEDIUM",
      color: "Black",
      gender: "MALE",
      goodWithKids: true,
      price: "150.00",
      currency: "USD",
      status: "AVAILABLE",
      description: "Pet created for store order testing.",
      medicalInfo: {
        vaccinated: true,
        spayedNeutered: true,
        microchipped: false,
        specialNeeds: false,
        healthNotes: "Healthy",
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const petId = petRes.json().id;
  return { token, userId, petId };
}

export default function (data) {
  crudOrders(data.token, data.petId, data.userId);
}

export function handleSummary(data) {
  return generateReport(data, "store-smoke");
}
