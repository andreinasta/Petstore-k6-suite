import { defaultThresholds } from "../config/thresholds.js";
import { crudPets } from "../tests/pets.test.js";
import { registerUser } from "../helpers/auth.js";
import { generateReport } from "../helpers/report.js";

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
  thresholds: defaultThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}

export function handleSummary(data) {
  return generateReport(data, "constant-rate");
}
