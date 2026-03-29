import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
import { generateReport } from "../../helpers/report.js";

export const options = {
  scenarios: {
    ramping_load: {
      executor: "ramping-arrival-rate",
      startRate: 1, // start at 1 iter/s
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 30,
      stages: [
        { duration: "10s", target: 3 }, // ramp to 3 iter/s
        { duration: "20s", target: 10 }, // ramp to 10 iter/s
        { duration: "10s", target: 10 }, // hold at 10 iter/s
        { duration: "10s", target: 1 }, // ramp back down
      ],
    },
  },
  thresholds: petThresholds,
};

export function setup() {
  return { token: registerUser() };
}

export default function (data) {
  crudPets(data.token);
}

export function handleSummary(data) {
  return generateReport(data, "pets-ramping-rate");
}
