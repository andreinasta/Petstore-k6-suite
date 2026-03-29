import { userThresholds } from "../../config/thresholds.js";
import { crudUsers } from "../../tests/users.test.js";
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
  thresholds: userThresholds,
};

export default function () {
  crudUsers();
}

export function handleSummary(data) {
  return generateReport(data, "users-load");
}
