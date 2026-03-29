import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";

const isProd = __ENV.PROFILE === "prod";

export const options = {
  stages: isProd
    ? [
        { duration: "2m", target: 10 },  // ramp up
        { duration: "5m", target: 10 },  // hold
        { duration: "2m", target: 0 },   // ramp down
      ]
    : [
        { duration: "10s", target: 10 }, // ramp up
        { duration: "30s", target: 10 }, // hold
        { duration: "10s", target: 0 },  // ramp down
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
  return generateReport(data, "pets-load");
}
