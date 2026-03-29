import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";

export const options = {
  stages: [
    { duration: "20s", target: 10 }, // ramp to normal
    { duration: "30s", target: 10 }, // hold normal
    { duration: "20s", target: 30 }, // ramp to moderate
    { duration: "30s", target: 30 }, // hold moderate
    { duration: "20s", target: 50 }, // ramp to high
    { duration: "30s", target: 50 }, // hold high
    { duration: "20s", target: 80 }, // ramp beyond limit
    { duration: "30s", target: 80 }, // hold beyond limit
    { duration: "30s", target: 0 }, // recovery
  ],
  thresholds: petThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}

export function handleSummary(data) {
  return generateReport(data, "pets-stress");
}
