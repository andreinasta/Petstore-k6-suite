import { petThresholds } from "../../config/thresholds.js";
import { crudPets } from "../../tests/pets.test.js";
import { registerUser } from "../../helpers/auth.js";
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
  return generateReport(data, "pets-stress");
}
