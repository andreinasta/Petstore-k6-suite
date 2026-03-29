import { defaultThresholds } from "../config/thresholds.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";
import { generateReport } from "../helpers/report.js";

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // warm up
    { duration: "10s", target: 100 }, // spike!
    { duration: "1m", target: 100 }, // stay at spike
    { duration: "10s", target: 5 }, // drop back
    { duration: "1m", target: 5 }, // recovery
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}

export function handleSummary(data) {
  return generateReport(data, "spike");
}
