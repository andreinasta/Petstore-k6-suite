import { defaultThresholds } from "../config/thresholds.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";
import { generateReport } from "../helpers/report.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}

export function handleSummary(data) {
  return generateReport(data, "smoke");
}
