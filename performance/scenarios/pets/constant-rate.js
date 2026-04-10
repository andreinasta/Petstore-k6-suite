import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";
import { del } from "../../utils/request.js";

export const options = {
  scenarios: {
    constant_load: {
      executor: "constant-arrival-rate",
      rate: 5, // 5 iterations per second
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 10, // VUs ready to go
      maxVUs: 20, // can scale up if needed
    },
  },
  thresholds: petThresholds,
};

export function setup() {
  const { token, userId } = registerUser();
  if (!token) throw new Error("Setup failed: user registration did not return a token");
  return { token, userId };
}

export default function (data) {
  crudPets(data.token);
}

export function teardown(data) {
  del(`/v1/users/${data.userId}`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
}

export function handleSummary(data) {
  return generateReport(data, "pets-constant-rate");
}
