import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";
import { del } from "../../utils/request.js";

export const options = {
  vus: 1,
  duration: "30s",
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
  return generateReport(data, "pets-smoke");
}
