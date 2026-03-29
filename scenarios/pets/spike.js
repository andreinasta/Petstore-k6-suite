import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";
import { del } from "../../utils/request.js";

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // warm up
    { duration: "10s", target: 100 }, // spike!
    { duration: "1m", target: 100 }, // stay at spike
    { duration: "10s", target: 5 }, // drop back
    { duration: "1m", target: 5 }, // recovery
    { duration: "30s", target: 0 }, // ramp down
  ],
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
  return generateReport(data, "pets-spike");
}
