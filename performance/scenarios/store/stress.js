import http from "k6/http";
import { storeThresholds } from "../../config/thresholds.js";
import { crudOrders } from "../../tests/store.test.js";
import { registerUserFull } from "../../helpers/auth.js";
import { currentEnv } from "../../config/environments.js";
import { generateReport } from "../../helpers/report.js";
import { del } from "../../utils/request.js";

const isProd = __ENV.PROFILE === "prod";

export const options = {
  stages: isProd
    ? [
        { duration: "2m", target: 10 },  // ramp to normal
        { duration: "5m", target: 10 },  // hold normal
        { duration: "2m", target: 30 },  // ramp to moderate
        { duration: "5m", target: 30 },  // hold moderate
        { duration: "2m", target: 50 },  // ramp to high
        { duration: "5m", target: 50 },  // hold high
        { duration: "2m", target: 80 },  // ramp beyond limit
        { duration: "5m", target: 80 },  // hold beyond limit
        { duration: "2m", target: 0 },   // recovery
      ]
    : [
        { duration: "20s", target: 10 }, // ramp to normal
        { duration: "30s", target: 10 }, // hold normal
        { duration: "20s", target: 30 }, // ramp to moderate
        { duration: "30s", target: 30 }, // hold moderate
        { duration: "20s", target: 50 }, // ramp to high
        { duration: "30s", target: 50 }, // hold high
        { duration: "20s", target: 80 }, // ramp beyond limit
        { duration: "30s", target: 80 }, // hold beyond limit
        { duration: "30s", target: 0 },  // recovery
      ],
  thresholds: storeThresholds,
};

export function setup() {
  const userData = registerUserFull();
  if (!userData || !userData.token || !userData.userId) {
    throw new Error("Setup failed: user registration did not return token or userId");
  }
  const { token, userId } = userData;

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

  if (petRes.status !== 201) {
    throw new Error(`Setup failed: pet creation returned status ${petRes.status}`);
  }

  const petId = petRes.json().id;
  return { token, userId, petId };
}

export default function (data) {
  crudOrders(data.token, data.petId, data.userId);
}

export function teardown(data) {
  del(`/v1/pets/${data.petId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  del(`/v1/users/${data.userId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}

export function handleSummary(data) {
  return generateReport(data, "store-stress");
}
